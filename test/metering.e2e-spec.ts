import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Metering Service (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Deployment Lifecycle: Create -> Wait -> Ready', async () => {
    // 1. Create
    const createRes = await request(app.getHttpServer())
      .post('/deployments')
      .send({ model: 'gpt-4o' })
      .expect(201);

    const depId = createRes.body.deployment_id;
    expect(createRes.body.status).toBe('provisioning');

    // 2. Wait for transition (The service has a 10s timeout)
    // We wait 11s to be safe
    console.log('Waiting 11s for deployment to become ready...');
    await new Promise((resolve) => setTimeout(resolve, 11000));

    // 3. Verify Ready
    const getRes = await request(app.getHttpServer())
      .get(`/deployments/${depId}`)
      .expect(200);

    expect(getRes.body.status).toBe('ready');
    expect(getRes.body.api_key).toBeDefined();
    expect(getRes.body.endpoint_url).toBeDefined();
  }, 20000); // Higher timeout for this test

  it('Completion & Usage: Inference -> Log Usage', async () => {
    // 1. Create and force ready state (to avoid waiting again)
    const createRes = await request(app.getHttpServer())
      .post('/deployments')
      .send({ model: 'gpt-3.5-turbo' })
      .expect(201);
    
    const depId = createRes.body.deployment_id;

    // Wait for it to be ready
    await new Promise((resolve) => setTimeout(resolve, 11000));
    
    const readyRes = await request(app.getHttpServer()).get(`/deployments/${depId}`);
    const apiKey = readyRes.body.api_key;

    // 2. Call Completion
    const completionRes = await request(app.getHttpServer())
      .post(`/v1/${depId}/completions`)
      .set('Authorization', `Bearer ${apiKey}`)
      .send({ prompt: 'Test prompt' })
      .expect(201);

    expect(completionRes.body.output).toBeDefined();
    const inputTokens = completionRes.body.input_tokens;

    // 3. Verify Usage recorded
    const usageRes = await request(app.getHttpServer())
      .get(`/usage?api_key=${apiKey}`)
      .expect(200);

    expect(usageRes.body.total_tokens).toBeGreaterThan(0);
    expect(usageRes.body.breakdown.length).toBe(1);
    expect(usageRes.body.breakdown[0].inputTokens).toBe(inputTokens);
  }, 20000);
});
