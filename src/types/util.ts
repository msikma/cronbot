// @dada78641/cronbot <https://github.com/msikma/cronbot>
// © MIT license

// Almost like a JSON type, except that undefined is included.
export type PlainValue =
    | string
    | number
    | boolean
    | null
    | undefined
    | {[key: string]: PlainValue}
    | Array<PlainValue>
