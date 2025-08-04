import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { ICryptoService } from '../interfaces/crypto.interface';

@Injectable()
export class CryptoService implements ICryptoService {
  private readonly saltRounds = 12;

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.saltRounds);
    return bcrypt.hash(password, salt);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  generateSalt(): string {
    return bcrypt.genSaltSync(this.saltRounds);
  }
} 