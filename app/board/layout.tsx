import type React from "react"
export default function BoardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <style>{`
          html, body {
            width: 1920px;
            height: 1080px;
            margin: 0;
            padding: 0;
            overflow: hidden;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
