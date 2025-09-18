import { Construct } from "constructs";
import {
  buildSsmPrivatePath,
  buildSsmPublicPath,
  readBindings,
  readBindingsByKeys,
} from "#src/helpers/ssm";

export type TVisibility = "public" | "private";

interface IBaseProps {
  readonly envName: string;
  readonly producerServiceName: string;
  readonly visibility?: TVisibility; // default: "public"
}

type TBindingsProps<TValues> =
  | (IBaseProps & { keys: readonly Extract<keyof TValues, string>[] })
  | (IBaseProps & { spec: { [K in keyof TValues]: string } });

class BindingsConstruct<TValues> extends Construct {
  readonly values: { [K in keyof TValues]: string };

  constructor(scope: Construct, id: string, props: TBindingsProps<TValues>) {
    super(scope, id);

    const {
      envName,
      producerServiceName,
      visibility = "public",
    } = props as IBaseProps;

    const basePath =
      visibility === "public"
        ? buildSsmPublicPath(envName, producerServiceName)
        : buildSsmPrivatePath(envName, producerServiceName);

    if ("keys" in props) {
      this.values = readBindingsByKeys(
        this,
        basePath,
        props.keys as readonly string[]
      ) as { [K in keyof TValues]: string };
    } else if ("spec" in props) {
      this.values = readBindings(
        this,
        basePath,
        props.spec as { [K in keyof TValues]: string }
      ) as { [K in keyof TValues]: string };
    } else {
      throw new Error(
        "BindingsConstruct requires either 'keys' or 'spec' in props"
      );
    }
  }
}

export default BindingsConstruct;
