import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaChevronDown, FaChevronUp, FaPhone, FaEnvelope, FaComments } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Help = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const faqCategories = [
    {
      title: 'Booking & Services',
      icon: '📋',
      faqs: [
        { q: 'How do I book a service?', a: 'Browse our services, select the one you need, choose a date and time, fill in your address details, and confirm your booking. You can pay online or choose cash on delivery.' },
        { q: 'Can I cancel a booking?', a: 'Yes, you can cancel a booking up to 2 hours before the scheduled time at no charge. Cancellations within 2 hours may incur a 25% cancellation fee.' },
        { q: 'How do I reschedule a booking?', a: 'Go to My Bookings, find the booking, and click Reschedule. Select a new date and time. Rescheduling is free if done 2+ hours in advance.' },
        { q: 'What if the service provider doesn\'t show up?', a: 'Contact us immediately through the app. We\'ll assign a replacement provider or issue a full refund within 24 hours.' },
      ]
    },
    {
      title: 'Payments & Pricing',
      icon: '💰',
      faqs: [
        { q: 'What payment methods are accepted?', a: 'We accept UPI, credit/debit cards, net banking, and cash on delivery. All online payments are securely processed.' },
        { q: 'How is pricing determined?', a: 'Prices are set by service providers and displayed upfront. The total includes service charges, visit charges (if any), and a small platform fee.' },
        { q: 'How do refunds work?', a: 'Refunds for cancelled bookings are processed within 3-5 business days to your original payment method.' },
      ]
    },
    {
      title: 'Account & Profile',
      icon: '👤',
      faqs: [
        { q: 'How do I create an account?', a: 'Click Register, fill in your details (name, email, phone), and verify your phone number with an OTP.' },
        { q: 'How do I become a service provider?', a: 'Click "Become a Provider" and fill in the registration form with your skills, experience, and documents. Our team will verify and approve your profile within 48 hours.' },
        { q: 'How do I update my profile?', a: 'Go to your Profile page from the menu. You can update your name, phone, address, and other details.' },
      ]
    },
    {
      title: 'Safety & Trust',
      icon: '🛡️',
      faqs: [
        { q: 'Are service providers verified?', a: 'Yes, all providers undergo background verification, skill assessment, and training before joining our platform.' },
        { q: 'What if I\'m not satisfied with the service?', a: 'You can raise a complaint through the app within 48 hours. Our team will investigate and offer a re-service or refund.' },
        { q: 'Is my payment information safe?', a: 'Absolutely. We use industry-standard SSL encryption and never store your full card details on our servers.' },
      ]
    },
  ];

  const filteredCategories = searchQuery
    ? faqCategories.map(cat => ({
        ...cat,
        faqs: cat.faqs.filter(f => f.q.toLowerCase().includes(searchQuery.toLowerCase()) || f.a.toLowerCase().includes(searchQuery.toLowerCase()))
      })).filter(cat => cat.faqs.length > 0)
    : faqCategories;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative gradient-hero overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="text-5xl mb-4 inline-block">💬</span>
            <h1 className="text-3xl md:text-5xl font-bold text-white">How can we help?</h1>
            <p className="text-blue-100 mt-4 text-lg">Search our FAQ or get in touch with our support team</p>
            <div className="mt-8 max-w-xl mx-auto relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for answers..." className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm shadow-xl" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredCategories.length > 0 ? (
            <div className="space-y-8">
              {filteredCategories.map((cat, ci) => (
                <motion.div key={ci} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <h2 className="flex items-center gap-3 text-xl font-bold text-gray-900 mb-4">
                    <span className="text-2xl">{cat.icon}</span> {cat.title}
                  </h2>
                  <div className="space-y-3">
                    {cat.faqs.map((faq, fi) => {
                      const key = `${ci}-${fi}`;
                      const isOpen = openFaq === key;
                      return (
                        <div key={fi} className="card overflow-hidden">
                          <button onClick={() => setOpenFaq(isOpen ? null : key)}
                            className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors">
                            <span className="font-medium text-gray-900 text-sm pr-4">{faq.q}</span>
                            {isOpen ? <FaChevronUp className="text-gray-400 text-xs flex-shrink-0" /> : <FaChevronDown className="text-gray-400 text-xs flex-shrink-0" />}
                          </button>
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }} className="overflow-hidden">
                                <div className="px-5 pb-5">
                                  <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4">{faq.a}</p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <span className="text-5xl">🔍</span>
              <p className="text-gray-500 mt-4 font-medium">No results found for "{searchQuery}"</p>
              <p className="text-gray-400 text-sm mt-1">Try different keywords or contact our support team</p>
            </div>
          )}
        </div>
      </section>

      {/* Contact */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center mb-8">Still need help?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {[
              { icon: <FaPhone className="text-primary-500" />, title: 'Call Us', desc: '+91 7451086410', sub: 'Mon-Sat, 8AM-10PM', href: 'tel:+917451086410' },
              { icon: <FaEnvelope className="text-primary-500" />, title: 'Email Us', desc: 'support@homefix.in', sub: 'Response within 24 hours', href: 'mailto:support@homefix.in' },
            ].map((item, i) => (
              <motion.a key={i} href={item.href} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="card p-6 text-center hover:shadow-lg transition-shadow cursor-pointer group block">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center text-xl mx-auto group-hover:scale-110 transition-transform">{item.icon}</div>
                <h3 className="font-semibold text-gray-900 mt-4">{item.title}</h3>
                <p className="text-sm text-primary-600 font-bold mt-1">{item.desc}</p>
                <p className="text-xs text-gray-400 mt-1">{item.sub}</p>
              </motion.a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Help;
