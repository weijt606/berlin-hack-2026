export const EVENT_PUBLISHER_PORT = Symbol('EVENT_PUBLISHER_PORT');

export interface DomainEvent<T = unknown> {
  topic: string;
  key?: string;
  payload: T;
  headers?: Record<string, string>;
}

export interface EventPublisherPort {
  publish<T>(event: DomainEvent<T>): Promise<void>;
}
