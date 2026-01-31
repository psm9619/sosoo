import Link from 'next/link';

const footerLinks = {
  service: [
    { href: '/about', label: '서비스 소개' },
    { href: '/examples', label: '예시' },
    { href: '/studio', label: '스튜디오' },
  ],
  legal: [
    { href: '/privacy', label: '개인정보처리방침' },
    { href: '/terms', label: '이용약관' },
    { href: '/data-policy', label: '데이터 정책' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-charcoal text-cream/80 mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal to-teal-dark flex items-center justify-center">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-white"
                >
                  <path
                    d="M12 2C10.9 2 10 2.9 10 4V12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2Z"
                    fill="currentColor"
                  />
                  <path
                    d="M17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12H5C5 15.53 7.61 18.43 11 18.92V22H13V18.92C16.39 18.43 19 15.53 19 12H17Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <span className="font-semibold text-lg text-cream">
                Voice<span className="text-teal">Up</span>
              </span>
            </div>
            <p className="text-sm text-cream/60 max-w-xs">
              AI가 당신의 말을 더 명확하고, 더 자신감 있게 다듬어드립니다.
            </p>
          </div>

          {/* Service Links */}
          <div>
            <h4 className="font-semibold text-cream mb-4">서비스</h4>
            <ul className="space-y-2">
              {footerLinks.service.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-cream/60 hover:text-teal transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-cream mb-4">정책</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-cream/60 hover:text-teal transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-cream/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-cream/40">
            © 2025 Sosoo. All rights reserved.
          </p>
          <p className="text-sm text-cream/40">
            Made with care in Seoul
          </p>
        </div>
      </div>
    </footer>
  );
}
