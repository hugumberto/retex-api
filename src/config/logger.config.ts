import { RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Params } from 'nestjs-pino';
import { TransportTargetOptions } from 'pino';

export function getLoggerConfig(configService: ConfigService) {
  const targets: TransportTargetOptions[] = [
    {
      target: 'pino/file',
      level: 'info',
      options: {}
    },
  ];

  const result: Params = {
    pinoHttp: {
      transport: {
        targets: targets,
      },
      level: 'trace',
      serializers: {
        req: (req) => {
          req.body = req.raw.body;
          return req;
        },
        res: (res) => {
          res.body = res.raw.body;
          return res;
        },
      },
    },
    exclude: [
      { method: RequestMethod.ALL, path: 'health' },
    ],
  };

  return result;
}
