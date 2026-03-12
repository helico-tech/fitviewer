declare module "@garmin/fitsdk" {
  export class Stream {
    static fromArrayBuffer(buffer: ArrayBuffer): Stream;
  }

  export class Decoder {
    constructor(stream: Stream);
    static isFIT(stream: Stream): boolean;
    static checkIntegrity(stream: Stream): boolean;
    read(options?: DecoderOptions): DecoderResult;
  }

  export type DecoderOptions = {
    applyScaleAndOffset?: boolean;
    expandSubFields?: boolean;
    expandComponents?: boolean;
    convertTypesToStrings?: boolean;
    convertDateTimesToDates?: boolean;
    mergeHeartRates?: boolean;
  };

  export type DecoderResult = {
    messages: FitMessages;
    errors: Error[];
  };

  export type FitMessages = {
    fileIdMesgs: any[];
    sessionMesgs: any[];
    recordMesgs: any[];
    lapMesgs: any[];
    deviceInfoMesgs: any[];
    [key: string]: any[];
  };
}
