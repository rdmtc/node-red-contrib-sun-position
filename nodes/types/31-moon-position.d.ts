declare const _exports: runtimeRED;
export = _exports;
/**
 * --- Type Defs ---
 */
export type runtimeRED = import('./types/typedefs.js').runtimeRED;
/**
 * --- Type Defs ---
 */
export type runtimeNode = import('./types/typedefs.js').runtimeNode;
/**
 * --- Type Defs ---
 */
export type runtimeNodeConfig = import('./types/typedefs.js').runtimeNodeConfig;
/**
 * --- Type Defs ---
 */
export type IPositionConfigNode = import("./10-position-config.js").IPositionConfigNode;
/**
 * Extensions for the nodeInstance object type
 */
export type IMoonPositionNodeInstance = {
    /**
     * -   tbd
     */
    positionConfig: IPositionConfigNode;
    /**
     * output topic
     */
    topic: string;
    /**
     * output topic
     */
    rules: any[];
    /**
     * type of start value
     */
    start: any;
    /**
     * start value
     */
    startType: string;
    /**
     * start offset value
     */
    startOffset: any;
    /**
     * type of the start offset value
     */
    startOffsetType: string;
    /**
     * start offset multipier
     */
    startOffsetMultiplier: number;
    /**
     * type of end value
     */
    end: any;
    /**
     * end value
     */
    endType: string;
    /**
     * end offset value
     */
    endOffset: any;
    /**
     * type of the end offset value
     */
    endOffsetType: string;
    /**
     * end offset multipier
     */
    endOffsetMultiplier: number;
    /**
     * end offset multipier
     */
    azimuthPos: any;
};
/**
 * Combine nodeInstance with additional, optional functions
 */
export type IMoonPositionNode = IMoonPositionNodeInstance & runtimeNode;
//# sourceMappingURL=31-moon-position.d.ts.map