import { useMap } from "@/components/ui/map"
import { useIsMobile } from "./use-mobile"
import { useLayoutEffect, useRef } from "react"
import {
    LngLatBounds,
    type FitBoundsOptions,
    type PaddingOptions,
} from "maplibre-gl"

const MAP_BOUNDS_SMALL_PADDING = 100
const MAP_BOUNDS_LARGE_PADDING = 500

export type UseFitBoundsOptions = Omit<FitBoundsOptions, "padding"> & {
    path: Array<[number, number]> | undefined
    padding?: (isMobile: boolean) => PaddingOptions
}

const paddingCallback = (isMobile: boolean) =>
    ({
        top: MAP_BOUNDS_SMALL_PADDING,
        bottom: isMobile ? MAP_BOUNDS_LARGE_PADDING : MAP_BOUNDS_SMALL_PADDING,
        left: isMobile ? MAP_BOUNDS_SMALL_PADDING : MAP_BOUNDS_LARGE_PADDING,
        right: MAP_BOUNDS_SMALL_PADDING,
    }) satisfies PaddingOptions

export default function useFitBounds({
    path,
    padding = paddingCallback,
    maxZoom = 14,
    speed = 1.2,
    ...rest
}: UseFitBoundsOptions) {
    const { map } = useMap()

    const isMobile = useIsMobile()
    const animated = useRef(false)

    useLayoutEffect(() => {
        if (!map || !path || path.length === 0 || animated.current) return

        const bounds = path.reduce(
            (bnds, coord) => {
                return bnds.extend(coord)
            },
            new LngLatBounds(path[0], path[0])
        )

        map.fitBounds(bounds, {
            padding: paddingCallback(isMobile),
            maxZoom,
            speed,
            ...rest,
        })

        animated.current = true
    }, [map, path, isMobile])
}
