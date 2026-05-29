import { decode } from "@googlemaps/polyline-codec"
import { createFileRoute } from "@tanstack/react-router"
import { useMemo } from "react"
import { MapRoute } from "@/components/ui/map"
import TripDetails from "@/features/trips/trip-details"
import VehiclesLayer from "@/features/vehicles/vehicles"
import { $api } from "@/lib/client"
import { FUTAR_API_VERSION } from "@/lib/constants"
import StopsLayer from "@/features/stops/stops"
import { vehicleFromTripResponse } from "@/lib/utils"
import type { TripDetailsResponse } from "@/lib/types"
import useFitBounds from "@/hooks/use-fit-bounds"

export const Route = createFileRoute("/trip/$id/$date")({
    component: RouteComponent,
})

function RouteComponent() {
    const { id, date } = Route.useParams()

    const queryResult = $api.useQuery(
        "get",
        "/{dialect}/api/where/trip-details",
        {
            params: {
                path: {
                    dialect: "mobile",
                },
                query: {
                    appVersion: import.meta.env.VITE_APP_VERSION ?? "1.0.0",
                    version: FUTAR_API_VERSION,
                    key: import.meta.env.VITE_FUTAR_API_KEY,
                    tripId: id,
                    date: date,
                },
            },
        },
        {
            refetchInterval: 5000,
        }
    )

    const data = queryResult.data?.data as TripDetailsResponse | undefined

    const path: Array<[number, number]> = useMemo(() => {
        const points = data?.entry.polyline?.points

        if (!points) {
            return []
        }

        const decoded = decode(points).map(
            (l) => l.reverse() as [number, number]
        )

        return decoded
    }, [data])

    useFitBounds({ path })

    const vehicle = useMemo(() => data && vehicleFromTripResponse(data), [data])

    const stopIds = useMemo(() => {
        return data && data.entry.stopTimes.map((st) => st.stopId)
    }, [data])

    return (
        <>
            {data && vehicle?.route && (
                <>
                    <MapRoute
                        coordinates={path}
                        color={`#${vehicle.route.style.color ?? "888"}`}
                        width={4}
                        opacity={0.8}
                    />
                    <StopsLayer
                        filter={
                            stopIds && [
                                "in",
                                ["get", "id"],
                                ["literal", stopIds],
                            ]
                        }
                    />
                    <VehiclesLayer tripIds={[id]} />
                    <TripDetails data={data} vehicle={vehicle} />
                </>
            )}
        </>
    )
}
