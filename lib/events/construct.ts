import { Construct } from "constructs";
// import TopicConstruct from "#lib/utils/topic/construct";
import type { IConfig } from "#config/default";

interface IEventsConstructProps {
  readonly config: IConfig;
}

class EventsConstruct extends Construct {
  constructor(scope: Construct, id: string, props: IEventsConstructProps) {
    super(scope, id);

    const { config } = props;

    // new TopicConstruct(this, "ExampleEventNameTopicConstruct", {
    //   config,
    //   topicName: "ExampleEventName",
    // });
  }
}

export default EventsConstruct;
