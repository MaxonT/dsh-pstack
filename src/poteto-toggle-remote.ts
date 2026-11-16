/** Remote metadata for the session-scoped poteto-mode switch. */

import type {
  InvocationDescriptor,
  InvocationParameterDescriptor,
  RemoteResult,
  TypertClientRemote,
  TypertCodec,
  TypertRemoteInfo,
  TypertRemoteMethod,
  TypertSchema,
} from "@deepseek-ai/dsh-typert-protocol";

export const REMOTE_PACKAGE = "dsh-pstack";
export const POTETO_SERVICE = "pstackPotetoMode";

type StrictCodec<Value> = Extract<TypertCodec<Value>, { readonly mode: "strict" }>;

function codec<Value>(typeSymbol: string, parse: (value: unknown) => Value): StrictCodec<Value> {
  return {
    mode: "strict",
    typeSymbol,
    create: (): TypertSchema<Value> => ({ parse }),
    decode: parse,
  };
}

function parameter(
  name: string,
  typeSymbol: string,
  parse: (value: unknown) => unknown,
): InvocationParameterDescriptor {
  return { name, wire: name, source: "json", codec: codec(typeSymbol, parse) };
}

function directMethod<Input extends object, Output>(options: {
  readonly method: string;
  readonly parameters: readonly InvocationParameterDescriptor[];
  readonly result: StrictCodec<Output>;
  readonly cancellation?: boolean;
}): TypertRemoteMethod<Input, Output> {
  const descriptor: InvocationDescriptor = {
    id: `${REMOTE_PACKAGE}#${POTETO_SERVICE}/${options.method}`,
    service: POTETO_SERVICE,
    namespace: POTETO_SERVICE,
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
      const namespace = Reflect.get(remote as object, POTETO_SERVICE) as Record<
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

const stringValue = (value: unknown): string => {
  if (typeof value !== "string" || value.trim() === "")
    throw new TypeError("expected a non-empty string");
  return value;
};
const booleanValue = (value: unknown): boolean => {
  if (typeof value !== "boolean") throw new TypeError("expected a boolean");
  return value;
};
const modeStatus = (value: unknown): { readonly enabled: boolean } => ({
  enabled: booleanValue((value as { enabled?: unknown } | null)?.enabled),
});

const statusMethod = directMethod<{ sessionId: string }, { enabled: boolean }>({
  method: "status",
  parameters: [parameter("sessionId", "PstackSessionId", stringValue)],
  result: codec("PstackPotetoModeStatus", modeStatus),
});
const setMethod = directMethod<{ sessionId: string; enabled: boolean }, { enabled: boolean }>({
  method: "setEnabled",
  parameters: [
    parameter("sessionId", "PstackSessionId", stringValue),
    parameter("enabled", "PstackPotetoModeEnabled", booleanValue),
  ],
  result: codec("PstackPotetoModeStatus", modeStatus),
  cancellation: true,
});
const getDefaultMethod = directMethod<Record<string, never>, { enabled: boolean }>({
  method: "getDefault",
  parameters: [],
  result: codec("PstackPotetoModeStatus", modeStatus),
});
const setDefaultMethod = directMethod<{ enabled: boolean }, { enabled: boolean }>({
  method: "setDefault",
  parameters: [parameter("enabled", "PstackPotetoModeEnabled", booleanValue)],
  result: codec("PstackPotetoModeStatus", modeStatus),
  cancellation: true,
});

export interface PstackPotetoModeNamespace {
  readonly pstackPotetoMode: {
    status(sessionId: string): Promise<RemoteResult<{ enabled: boolean }>>;
    setEnabled(
      sessionId: string,
      enabled: boolean,
      signal?: AbortSignal,
    ): Promise<RemoteResult<{ enabled: boolean }>>;
    getDefault(): Promise<RemoteResult<{ enabled: boolean }>>;
    setDefault(enabled: boolean, signal?: AbortSignal): Promise<RemoteResult<{ enabled: boolean }>>;
  };
}

export const pstackPotetoRemote: TypertRemoteInfo = {
  package: REMOTE_PACKAGE,
  descriptors: [
    statusMethod,
    setMethod,
    getDefaultMethod,
    setDefaultMethod,
  ] as InvocationDescriptor[],
  methods: {
    [`${POTETO_SERVICE}/status`]: statusMethod,
    [`${POTETO_SERVICE}/setEnabled`]: setMethod,
    [`${POTETO_SERVICE}/getDefault`]: getDefaultMethod,
    [`${POTETO_SERVICE}/setDefault`]: setDefaultMethod,
  } as TypertRemoteInfo["methods"],
};
