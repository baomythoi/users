import * as nanoid from 'nanoid';

export default new class NanoId {
  generateCorrelationId(): string {
    return nanoid.nanoid();
  }

  generateRandomId(size = 21): string {
    return nanoid.nanoid(size);
  }
}