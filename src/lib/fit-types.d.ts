declare module "@garmin/fitsdk" {
  export class Stream {
    static fromArrayBuffer(buffer: ArrayBuffer): Stream;
  }

  export class Encoder {
    constructor(options?: { fieldDescriptions?: Record<string, unknown> | null });
    writeMesg(mesg: Record<string, unknown>): this;
    close(): Uint8Array;
  }

  export class Decoder {
    constructor(stream: Stream);
    static isFIT(stream: Stream): boolean;
    isFIT(): boolean;
    checkIntegrity(): boolean;
    read(options?: DecoderOptions): DecoderResult;
  }

  export type DecoderOptions = {
    mesgListener?: ((mesgNum: number, message: Record<string, unknown>) => void) | null;
    mesgDefinitionListener?: ((mesgDefinition: Record<string, unknown>) => void) | null;
    fieldDescriptionListener?: ((key: number, developerDataIdMesg: Record<string, unknown>, fieldDescriptionMesg: Record<string, unknown>) => void) | null;
    expandSubFields?: boolean;
    expandComponents?: boolean;
    applyScaleAndOffset?: boolean;
    convertTypesToStrings?: boolean;
    convertDateTimesToDates?: boolean;
    includeUnknownData?: boolean;
    mergeHeartRates?: boolean;
    decodeMemoGlobs?: boolean;
    skipHeader?: boolean;
    dataOnly?: boolean;
  };

  export type DecoderResult = {
    messages: FitMessages;
    profileVersion: number | null;
    errors: Error[];
  };

  export type FitMessages = {
    fileIdMesgs: any[];
    sessionMesgs: any[];
    recordMesgs: any[];
    lapMesgs: any[];
    deviceInfoMesgs: any[];
    hrMesgs: any[];
    [key: string]: any[];
  };

  export const Profile: {
    version: { major: number; minor: number; patch: number; type: string };
    messages: Record<number, Record<string, unknown>>;
    types: Record<string, Record<string, unknown>>;
  };
}
