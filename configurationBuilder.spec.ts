import { ConfigurationBuilder } from './configurationBuilder';

const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = {
    ...originalEnv,
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('ConfigurationBuilder', () => {
  it('should deep merge environment variables', async () => {
    const builder = new ConfigurationBuilder();
    builder.addEnv();
    process.env = {
      A: 'B',
      C: 'D',
      E__F: 'G',
      E__H: 'I',
      E__F__J: 'K',
    };
    const actual = (await builder.build()) as any;
    expect(actual.A).toBe('B');
  });
});
