// @flow
export type FeatureOptions = {
    enabled: Boolean,
    [key: string]: any,
};

export type FeatureConfig = {
    [key: string]: FeatureOptions,
};
