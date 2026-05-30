import './globals.css';

export const metadata = {
  title: 'AI Exam Maker',
  description: 'Turn learning materials into a custom quiz.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="font-sans">
      <body>{children}</body>
    </html>
  );
}
