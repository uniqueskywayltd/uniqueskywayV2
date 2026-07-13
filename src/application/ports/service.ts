export interface ActorContext {
  actorId: string;
  actorType: "customer" | "admin" | "system";
}

export interface ServiceContext {
  requestId: string;
  actor?: ActorContext;
}

export interface CommandService<TInput, TOutput> {
  execute(input: TInput, context: ServiceContext): Promise<TOutput>;
}

export interface QueryService<TInput, TOutput> {
  execute(input: TInput, context: ServiceContext): Promise<TOutput>;
}
