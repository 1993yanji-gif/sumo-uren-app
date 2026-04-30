import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sumo Markthal - Authentic Japanese Cuisine',
  description: 'Experience authentic Japanese cuisine in the heart of Rotterdam Markthal. Fresh sushi, traditional dishes, and modern dining.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <body className="antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(g,s,t,p,l,n){
                g["_gstpln"]={};
                (l=s.createElement(t)),(n=s.getElementsByTagName(t)[0]);
                l.async=1;l.src=p;n.parentNode.insertBefore(l,n);
              })(window,document,"script","https://cdn.guestplan.com/widget.js");
              _gstpln.accessKey = "c881262e833eef57902ce300c17f72c2b7968f90";
              _gstpln.color = "#d4a83c";
              _gstpln.fabText = "Reserveer een tafel";
            `
          }}
        />
      </body>
    </html>
  )
}
