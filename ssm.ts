import { SSM } from 'aws-sdk';

const getParameterWorker = async (
  name: string,
  decrypt: boolean,
): Promise<string | undefined> => {
  const ssm = new SSM();
  const result = await ssm
    .getParameter({ Name: name, WithDecryption: decrypt })
    .promise();
  return result.Parameter?.Value;
};

export const getParameter = async (name: string): Promise<string | undefined> =>
  getParameterWorker(name, false);

export const getEncryptedParameter = async (
  name: string,
): Promise<string | undefined> => getParameterWorker(name, true);
