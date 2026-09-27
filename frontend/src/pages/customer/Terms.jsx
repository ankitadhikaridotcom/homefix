import { motion } from 'framer-motion';

const Terms = () => {
  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: 'By accessing or using the HomeFix platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. These terms apply to all users of the platform, including customers, service providers, and visitors.'
    },
    {
      title: '2. Description of Services',
      content: 'HomeFix provides an online marketplace that connects customers seeking home services with independent service providers. We do not directly provide any home repair, maintenance, or cleaning services. Service providers are independent contractors and not employees of HomeFix.'
    },
    {
      title: '3. User Accounts',
      content: 'To use certain features of our platform, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate, current, and complete information during registration.'
    },
    {
      title: '4. Booking & Payments',
      content: 'When you book a service through HomeFix, you agree to pay the listed price plus any applicable fees. Payment is processed securely through our platform. Refunds are subject to our cancellation policy. Service providers set their own rates, and HomeFix charges a platform fee for facilitating the connection.'
    },
    {
      title: '5. Cancellation Policy',
      content: 'Customers may cancel a booking free of charge up to 2 hours before the scheduled service time. Cancellations made within 2 hours may incur a cancellation fee of up to 25% of the booking amount. No-shows will be charged the full booking amount.'
    },
    {
      title: '6. Service Provider Terms',
      content: 'Service providers on HomeFix are independent contractors. They are responsible for the quality of their work, maintaining proper licenses, and carrying appropriate insurance. HomeFix reserves the right to remove providers who fail to meet our quality standards.'
    },
    {
      title: '7. Reviews & Ratings',
      content: 'Users may leave reviews and ratings for services received. Reviews must be honest, accurate, and based on genuine experiences. HomeFix reserves the right to remove reviews that violate our community guidelines, including fake, abusive, or misleading reviews.'
    },
    {
      title: '8. Limitation of Liability',
      content: 'HomeFix acts as a marketplace and is not liable for the quality, safety, or legality of services provided by service providers. We are not responsible for any damages, injuries, or losses resulting from services booked through our platform. Our liability is limited to the platform fees collected.'
    },
    {
      title: '9. Privacy',
      content: 'Your use of HomeFix is also governed by our Privacy Policy, which describes how we collect, use, and share your personal information. By using our platform, you consent to our data practices as described in the Privacy Policy.'
    },
    {
      title: '10. Changes to Terms',
      content: 'HomeFix reserves the right to modify these Terms of Service at any time. Changes will be effective when posted on the platform. Your continued use of the platform after changes constitutes acceptance of the updated terms.'
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-4xl mb-4 inline-block">📜</span>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Terms of Service</h1>
            <p className="text-gray-400 mt-3">Last updated: January 1, 2026</p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="card p-6 md:p-10 mb-8">
            <p className="text-gray-600 leading-relaxed">
              Welcome to HomeFix. These Terms of Service ("Terms") govern your use of the HomeFix platform, 
              including our website and mobile applications. Please read these terms carefully before using our services.
            </p>
          </motion.div>

          <div className="space-y-6">
            {sections.map((section, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }}
                className="card p-6 md:p-8 hover:shadow-md transition-shadow">
                <h2 className="text-lg font-bold text-gray-900 mb-3">{section.title}</h2>
                <p className="text-gray-600 leading-relaxed text-sm">{section.content}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="mt-10 bg-primary-50 rounded-2xl p-8 text-center">
            <p className="text-gray-700 font-medium">Have questions about our terms?</p>
            <p className="text-sm text-gray-500 mt-1">Contact us at <strong className="text-primary-600">legal@homefix.in</strong></p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Terms;
