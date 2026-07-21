import { EntitySchema } from 'typeorm';
import {
  EmailLog,
  EmailLogStatus,
} from '../../../../domain/email-log/email-log.entity';
import { BaseTimestampColumns } from '../abstraction/timestamp';

export const emailLogSchema = new EntitySchema<EmailLog>({
  name: 'email_log',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
    },
    type: {
      type: 'varchar',
      nullable: false,
    },
    subject: {
      type: 'varchar',
      nullable: false,
    },
    recipient: {
      type: 'varchar',
      nullable: false,
    },
    userId: {
      type: 'uuid',
      nullable: true,
      name: 'user_id',
    },
    status: {
      type: 'enum',
      enum: EmailLogStatus,
      nullable: false,
    },
    error: {
      type: 'text',
      nullable: true,
    },
    sentAt: {
      type: 'timestamp with time zone',
      nullable: false,
      name: 'sent_at',
    },
    ...BaseTimestampColumns,
  },
  indices: [
    { name: 'IDX_email_log_type', columns: ['type'] },
    { name: 'IDX_email_log_user_id', columns: ['userId'] },
    { name: 'IDX_email_log_sent_at', columns: ['sentAt'] },
  ],
});
