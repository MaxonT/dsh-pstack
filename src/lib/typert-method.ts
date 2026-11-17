/** Shared Typert direct-invocation descriptor plumbing for the pstack Remote namespaces. */

import type {
  InvocationDescriptor,
  InvocationParameterDescriptor,
  RemoteResult,
  TypertClientRemote,
  TypertCodec,
  TypertRemoteMethod,
  TypertSchema,
} from "@deepseek-ai/dsh-typert-protocol";

/** npm package owning every pstack Remote namespace. */
export const REMOTE_PACKAGE = "dsh-pstack";

type StrictCodec<Value> = Extract<TypertCodec<Value>, { readonly mode: "strict" }>;

/** Wrap one strict parser as a Typert codec. */
export function codec<Value>(
  typeSymbol: string,
  parse: (value: unknown) => Value,
): StrictCodec<Value> {
  return {
    mode: "strict",
    typeSymbol,
    create: (): TypertSchema<Value> => ({ parse }),
    decode: parse,
  };
}

/** Build one JSON-source invocation parameter. */
export function parameter(
  name: string,
  typeSymbol: string,
  parse: (value: unknown) => unknown,
): InvocationParameterDescriptor {
  return { name, wire: name, source: "json", codec: codec(typeSymbol, parse) };
}

/** Options for one direct-return invocation method. */
export interface DirectOptions<Output> {
  readonly method: string;
  readonly parameters: readonly InvocationParameterDescriptor[];
  readonly result: StrictCodec<Output>;
  readonly cancellation?: boolean;
}

/** Build one direct-invocation method bound to a service namespace. */
export function directMethod<Input extends object, Output>(
  service: string,
  options: DirectOptions<Output>,
): TypertRemoteMethod<Input, Output> {
  const descriptor: InvocationDescriptor = {
    id: `${REMOTE_PACKAGE}#${service}/${options.method}`,
    service,
    namespace: service,
    method: options.method,
    invocation: { kind: "direct" },
    parameters: options.parameters,
    result: options.result,
    ...(options.cancellation === true ? { cancellation: { parameter: "signal" } } : {}),
  };
  return {
    ...descriptor,
    input(): { create: () => TypertSchema<Input> } {
      return {
        create: () => ({
          parse(value: unknown): Input {
            if (typeof value !== "object" || value === null || Array.isArray(value)) {
              throw new TypeError("the method input must be an object");
            }
            const record = value as Record<string, unknown>;
            const parsed: Record<string, unknown> = {};
            for (const item of options.parameters) {
              if (item.codec.mode !== "strict") throw new TypeError("expected a strict codec");
              parsed[item.wire] = item.codec.create().parse(record[item.wire]);
            }
            return parsed as Input;
          },
        }),
      };
    },
    invoke(
      remote: TypertClientRemote,
      input: Input,
      signal?: AbortSignal,
    ): Promise<RemoteResult<Output>> {
      const namespace = Reflect.get(remote as object, service) as Record<
        string,
        (...args: unknown[]) => Promise<RemoteResult<Output>>
      >;
      const values = options.parameters.map(
        (item) => (input as Record<string, unknown>)[item.wire],
      );
      if (options.cancellation === true) values.push(signal);
      return namespace[options.method]!(...values);
    },
  } as TypertRemoteMethod<Input, Output>;
}
