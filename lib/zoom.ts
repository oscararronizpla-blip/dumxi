async function getZoomToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString("base64")

  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
    {
      method: "POST",
      headers: { Authorization: `Basic ${credentials}` },
    }
  )
  const data = await res.json()
  return data.access_token
}

export async function createZoomMeeting({
  topic,
  startTime,
  durationMinutes,
}: {
  topic: string
  startTime: string
  durationMinutes: number
}) {
  const token = await getZoomToken()

  const res = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic,
      type: 2,
      start_time: startTime,
      duration: durationMinutes,
      timezone: "Europe/Madrid",
      settings: {
        waiting_room: true,
        join_before_host: false,
        mute_upon_entry: true,
        auto_recording: "none",
      },
    }),
  })

  return await res.json()
}
