import { Construct } from "constructs";
import SampleEventConstruct from "./sample-event/construct";

interface EventsConstructProps {
  envName: string;
}

class EventsConstruct extends Construct {
  sampleEvent: SampleEventConstruct;

  constructor(scope: Construct, id: string, props: EventsConstructProps) {
    super(scope, id);

    const { envName } = props;

    this.sampleEvent = new SampleEventConstruct(this, "SampleEventConstruct", {
      envName,
    });
  }
}

export default EventsConstruct;
