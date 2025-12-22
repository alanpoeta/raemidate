import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../helpers/api';
import { useAuth } from '../helpers/AuthContext';

const TOS = ({ view_only = false }) => {
  const [isChecked, setIsChecked] = useState(false);
  const { prefetchQueries } = useAuth();

  const acceptMutation = useMutation({
    mutationFn: () => api.post('accept-tos/'),
    onSuccess: prefetchQueries
  });

  return (
    <div className="p-6 max-w-2xl mx-auto pb-24">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-6">Effective date: 2025-11-29</p>

      <div className="prose prose-sm prose-rose max-w-none text-gray-700">
        <p className="mb-4">
          These Terms of Service ("Terms") govern your use of Rämidate (the "App").
          "Rämidate", "the App", "we", "us", and "our" refer to the operator of the App,
          based in Zurich, Switzerland.
        </p>

        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-2">Definitions</h3>
        <p className="mb-4">
          For the purposes of these Terms: <strong>"Account"</strong> means the user account you create;
          <strong> "Content"</strong> means any text, images or media you upload; <strong>"Personal Data" </strong>
          means information that identifies you; and <strong>"Controller"</strong> means Rämidate (operator).
        </p>

        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-2">Controller & contact</h3>
        <p className="mb-4">
          The data controller for user data is Rämidate, based in Zurich, Switzerland.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">1. Acceptance</h2>
        <p className="mb-4">
          By creating an account, using the App, or otherwise engaging with the App's services
          you agree to these Terms. If you do not agree, do not use the App.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">2. Eligibility & Minimum Age</h2>
        <p className="mb-4">
          You must be at least 14 years old to register and use the App. By registering
          you confirm that you are 14 or older. We may terminate accounts
          suspected of belonging to users under the age of 14.
        </p>
        <p className="mb-4">
          Users aged 14–17 may use the App, but must comply with safety restrictions. Sexual
          content involving minors, exploitation, or any sexual behavior that involves a person
          under 18 is strictly prohibited and will lead to immediate account termination and
          reporting to authorities where applicable.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">3. Accounts & Security</h2>
        <p className="mb-4">
          You must register with accurate information, keep credentials secure, and notify us
          of unauthorized account access. You are responsible for all activity under your account.
        </p>
        <p className="mb-4">
          Email verification and acceptance of these Terms are required before core features
          (such as swiping, matching, and messaging) are enabled.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">4. Prohibited Conduct</h2>
        <ul className="list-disc pl-5 mb-4 space-y-1">
          <li>No harassment, hate speech, threats, bullying or stalking.</li>
          <li>No sexual exploitation, grooming, or sexual content involving minors.</li>
          <li>No illegal activity, trafficking, solicitation, or fraud.</li>
          <li>No spam, bulk messaging or unsolicited commercial activity.</li>
          <li>No impersonation, false information, or bypassing restrictions or rate limits.</li>
        </ul>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">5. Content, Ownership & License</h2>
        <p className="mb-4">
          You retain intellectual property rights in content you upload. By posting content,
          you grant Rämidate a non-exclusive license to store, display, and distribute your content
          to provide the service. We may remove or refuse content that violates these Terms.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">6. Moderation & Reporting</h2>
        <p className="mb-4">
          We moderate content using manual review. You may report abusive
          behavior or content via in-app tools. We may suspend or permanently delete accounts that
          violate these Terms. When we ban an account we may retain a cryptographic hash of the user's
          email address so that the same email cannot be immediately reused to recreate an account. The
          stored hash is one-way and cannot be used to reconstruct the original email address. We may
          cooperate with law enforcement if required.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">7. Safety & Offline Interactions</h2>
        <p className="mb-4">
          Rämidate does not guarantee the behavior, safety or identity of other users. Exercise
          caution when meeting people offline. If you feel unsafe, contact local authorities.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">8. Privacy Policy</h2>
        <p className="mb-4">
          This section describes how Rämidate collects, uses, stores and shares personal data.
          By accepting the Terms of Service you also accept the Privacy Policy and consent to the
          processing described below.
        </p>

        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-2">Data we collect</h3>
        <ul className="list-disc pl-5 mb-4 space-y-1">
          <li>Account information: email, username, hashed password</li>
          <li>
            Profile data: profile photos, first and last name, bio, birth date, gender, sexual preference, age preferences
          </li>
          <li>During registration, the user’s real name is derived from the school email address for identification and impersonation prevention.</li>
          <li>Usage and matching data: swipe/match history and message metadata to operate the core service.</li>
          <li>Messages: messages you send and receive are stored to deliver the chat experience.</li>
          <li>Device & analytics data: device metadata, IP addresses and analytics used to monitor service health.</li>
        </ul>

        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-2">How we use your data</h3>
        <ul className="list-disc pl-5 mb-4 space-y-1">
          <li>Provide and operate the core service: matching, messaging and profile management.</li>
          <li>Communication: in-app notifications.</li>
          <li>Security and abuse prevention: detecting suspicious activity, spam, and enforcing our policies.</li>
          <li>Analytics and product improvement: to make the App better and more reliable.</li>
        </ul>

        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-2">Sharing & third-party processors</h3>
        <p className="mb-4">
          We do not share your personal data with third parties for their own use. We may provide your
          email address to an email delivery service when sending email verification.
          These limited disclosures are solely to enable delivery of those emails and are not used for
          profiling or advertising.
        </p>
        <p className="mb-4">
          Our services are hosted by <strong>Render Services, Inc.</strong>, a company 
          headquartered in the <strong>USA</strong>. While our servers and databases 
          are physically located in <strong>Frankfurt, Germany</strong>, Render Services, Inc. 
          maintains legal control over the infrastructure.
        </p>

        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-2">Cookies, tracking & local storage</h3>
        <p className="mb-4">
          We use local storage to provide the site experience and to store session tokens.
        </p>

        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-2">Data retention</h3>
        <p className="mb-4">
          We retain account and profile data while your account is active. When you delete your account,
          we will delete personal data immediately. As noted above, an exception exists for limited,
          one-way identifiers (such as cryptographic email hashes) that we may retain solely for the purpose
          of preventing banned users from recreating accounts; these identifiers cannot be used
          to recover the original data and are retained only as long as necessary for abuse prevention.
        </p>

        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-2">User rights & how to exercise them</h3>
        <p className="mb-4">
          You may request access, correction, deletion, or export of your personal data by contacting
          <a href="mailto:raemidate@gmail.com" className="text-primary hover:underline ml-1">raemidate@gmail.com</a>.
        </p>

        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-2">Account suspension, appeals & deletion process</h3>
        <p className="mb-4">
          Accounts that violate these Terms may be suspended or terminated. If your account is suspended you may
          contact support to request review or appeal at <a href="mailto:raemidate@gmail.com" className="text-primary hover:underline">raemidate@gmail.com</a>.
          When an account is deleted, we follow the retention rules above and assist with data export/deletion requests.
        </p>

        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-2">Your rights</h3>
        <ul className="list-disc pl-5 mb-4 space-y-1">
          <li>Correction: you can correct inaccurate profile information.</li>
          <li>Deletion: you can request deletion of your data and account.</li>
        </ul>

        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-2">Minors</h3>
        <p className="mb-4">
          Users aged 14–17 are allowed to use Rämidate under these Terms but are subject to additional protections.
          We do not allow sexual content involving minors or any exploitation of users under 18. If you are a parent
          or guardian and believe a minor is using our service without consent, contact us so we can investigate.
        </p>

        <h3 className="text-lg font-bold text-gray-800 mt-6 mb-2">Data security & encryption</h3>
        <p className="mb-4">
          We use reasonable technical and organizational measures to help protect personal data. This includes:
          data transport protections (TLS/HTTPS) and encryption of selected sensitive fields before storing them
          in the database. These steps help reduce the risk of unauthorized access to stored personal data. All data is stored in 
          databases encrypted at rest and in transit using AES-256 encryption.
        </p>
        <p className="mb-4">
          Please be aware that the App must be able to decrypt certain data to provide normal functionality (for example,
          to deliver messages or show profile information). Therefore the App cannot offer a zero‑knowledge guarantee.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">9. Disclaimers & Liability</h2>
        <p className="mb-4">
          The App is provided "as is." To the maximum extent allowed by law, we disclaim all
          warranties. We are not responsible for any direct, indirect, incidental or consequential
          damages arising from use of the App.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">10. Changes to Terms</h2>
        <p className="mb-4">
          We may modify these Terms. We will post changes to the App and update the effective
          date. Material changes will be notified and may require re-acceptance.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">11. Governing Law</h2>
        <p className="mb-4">
          These Terms are governed by the laws of Switzerland. Any disputes will be handled
          according to Swiss law and competent Zurich courts unless otherwise agreed.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">12. Contact</h2>
        <p className="mb-4">
          For support or legal inquiries contact: <a href="mailto:raemidate@gmail.com" className="text-primary hover:underline">raemidate@gmail.com</a>
        </p>
      </div>

      {!view_only &&
        <div className="mt-8 bg-gray-50 p-6 rounded-xl border border-gray-100 sticky bottom-6 shadow-lg">
          <label className="flex items-start gap-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              name="accept"
              checked={isChecked}
              onChange={e => setIsChecked(e.target.checked)}
              required
              className="mt-1 w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
            />
            <span className="text-sm text-gray-700">I have read and agree to the <strong>Terms of Service</strong> and <strong>Privacy Policy</strong> for Rämidate</span>
          </label>
          
          <button
            onClick={() => acceptMutation.mutate()}
            disabled={!isChecked || acceptMutation.isPending}
            className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {acceptMutation.isPending ? 'Accepting...' : 'Accept Terms & Privacy Policy'}
          </button>
        </div>
      }
    </div>
  );
}

export default TOS;
