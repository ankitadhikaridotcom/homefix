import { Link } from 'react-router-dom';
import { FaTwitter, FaInstagram, FaLinkedin, FaPhone, FaEnvelope, FaMapMarkerAlt, FaHeart, FaShieldAlt } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="relative bg-slate-900 text-slate-300 overflow-hidden pt-12 pb-8 border-t border-slate-800">
      {/* Subtle Glow Accents */}
      <div className="absolute -top-24 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 pb-12 border-b border-slate-800/80">

          {/* Column 1: Brand Info */}
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="text-3xl">🏠</span>
              <span className="text-2xl font-black tracking-tight text-white">
                Home<span className="text-primary-400">Fix</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Your trusted marketplace for verified home services in your area. Professional electricians, plumbers, cleaners, and more right at your doorstep.
            </p>
            <div className="flex items-center gap-2 pt-2">
              {[
                { icon: FaTwitter, href: 'https://x.com/NirmalBish94960', label: 'Twitter' },
                { icon: FaInstagram, href: '#', label: 'Instagram' },
                { icon: FaLinkedin, href: 'https://www.linkedin.com/in/nirmalsingh110/', label: 'LinkedIn' },
              ].map((social, idx) => (
                <a
                  key={idx}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-primary-600 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary-600/30 border border-slate-700/50"
                >
                  <social.icon className="text-sm" />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-white font-bold text-base tracking-wide mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-400"></span> Services
            </h4>
            <ul className="space-y-2.5 text-sm">
              {['Electrician', 'Plumber', 'Cleaning', 'Carpenter', 'AC Service', 'Painter'].map((service) => (
                <li key={service}>
                  <Link
                    to={`/services?category=${encodeURIComponent(service)}`}
                    className="text-slate-400 hover:text-primary-400 transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="text-xs text-slate-600 group-hover:text-primary-400 transition-colors">›</span>
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h4 className="text-white font-bold text-base tracking-wide mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary-400"></span> Company
            </h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'About Us', to: '/about' },
                { label: 'Help Center', to: '/help' },
                { label: 'Terms of Service', to: '/terms' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-slate-400 hover:text-primary-400 transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="text-xs text-slate-600 group-hover:text-primary-400 transition-colors">›</span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact & Location */}
          <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm space-y-4">
            <h4 className="text-white font-bold text-base tracking-wide flex items-center gap-2">
              <FaShieldAlt className="text-primary-400 text-sm" /> Contact Info
            </h4>

            <div className="space-y-3 text-sm">
              {/* Phone */}
              <a
                href="tel:+917451086410"
                className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors group p-2 rounded-xl hover:bg-slate-800/80 border border-transparent hover:border-slate-700"
              >
                <div className="w-9 h-9 rounded-xl bg-primary-500/10 text-primary-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <FaPhone className="text-xs" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Mobile Number</p>
                  <p className="font-bold text-white group-hover:text-primary-400 transition-colors">+91 7451086410</p>
                </div>
              </a>

              {/* Email */}
              <a
                href="mailto:support@homefix.in"
                className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors group p-2 rounded-xl hover:bg-slate-800/80 border border-transparent hover:border-slate-700"
              >
                <div className="w-9 h-9 rounded-xl bg-secondary-500/10 text-secondary-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <FaEnvelope className="text-xs" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Support Email</p>
                  <p className="font-medium text-slate-200">support@homefix.in</p>
                </div>
              </a>


            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} HomeFix. All rights reserved.</p>
          <div className="flex items-center gap-1 bg-slate-800/60 px-4 py-2 rounded-full border border-slate-700/50">
            <span>Made with</span>
            <FaHeart className="text-red-500 animate-pulse text-xs mx-0.5" />           
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
