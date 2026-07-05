export interface SolarTimes {
  sunrise: string
  sunset: string
  goldenHourMorning: string
  goldenHourEvening: string
}

export function calculateSolarTimes(
  latitude: number,
  longitude: number,
  date: Date = new Date()
): SolarTimes {
  const day = date.getDate()
  const month = date.getMonth()
  const year = date.getFullYear()

  const now = new Date(year, month, day)
  const start = new Date(year, 0, 0)
  const diff = now.getTime() - start.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  const dayOfYear = Math.floor(diff / oneDay)

  const latRad = (latitude * Math.PI) / 180


  const decRad = 23.45 * (Math.PI / 180) * Math.sin(2 * Math.PI * (284 + dayOfYear) / 365)

  const sunAltRad = (-0.83 * Math.PI) / 180

  const cosOmega = (Math.sin(sunAltRad) - Math.sin(latRad) * Math.sin(decRad)) / (Math.cos(latRad) * Math.cos(decRad))

  let sunriseHour = 6.0
  let sunsetHour = 18.0

  if (cosOmega <= 1 && cosOmega >= -1) {
    const omega = Math.acos(cosOmega)
    const omegaDeg = (omega * 180) / Math.PI
    const hourAngle = omegaDeg / 15.0

    const standardMeridian = 105.0

    const b = (360 / 365) * (dayOfYear - 81) * Math.PI / 180
    const eot = (9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b)) / 60.0

    const solarNoon = 12.0 - (longitude - standardMeridian) / 15.0 - eot

    sunriseHour = solarNoon - hourAngle
    sunsetHour = solarNoon + hourAngle
  }

  const formatTime = (decimalHours: number): string => {
    let hours = Math.floor(decimalHours)
    let minutes = Math.round((decimalHours - hours) * 60)
    if (minutes === 60) {
      hours += 1
      minutes = 0
    }
    hours = (hours + 24) % 24
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
  }

  const sunrise = formatTime(sunriseHour)
  const sunset = formatTime(sunsetHour)

  const goldenHourMorning = `${formatTime(sunriseHour)} - ${formatTime(sunriseHour + 1.0)}`
  const goldenHourEvening = `${formatTime(sunsetHour - 1.0)} - ${formatTime(sunsetHour)}`

  return {
    sunrise,
    sunset,
    goldenHourMorning,
    goldenHourEvening,
  }
}
