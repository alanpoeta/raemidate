import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../helpers/api';
import { useAuth } from '../helpers/AuthContext';

const TOS = () => {
  const [isChecked, setIsChecked] = useState(false);
  const { prefetchQueries } = useAuth();

  const acceptMutation = useMutation({
    mutationFn: () => api.post('accept-tos/'),
    onSuccess: prefetchQueries
  });

  return (
    <>
      <h1>Terms of Service — Rämidate</h1>
      <p>Effective date: 2025-11-29</p>

      <p>
        These Terms of Service ("Terms") govern your use of Rämidate (the "App").
        "Rämidate", "the App", "we", "us", and "our" refer to the operator of the App,
        based in Zurich, Switzerland.
      </p>

      <h3>Definitions</h3>
      <p>
        For the purposes of these Terms: <strong>"Account"</strong> means the user account you create;
        <strong> "Content"</strong> means any text, images or media you upload; <strong>"Personal Data"</strong>
        means information that identifies you; and <strong>"Controller"</strong> means Rämidate (operator).
      </p>

      <h3>Controller & contact</h3>
      <p>
        The data controller for user data is Rämidate, based in Zurich, Switzerland.
      </p>

      <h2>1. Acceptance</h2>
      <p>
        By creating an account, using the App, or otherwise engaging with the App's services
        you agree to these Terms. If you do not agree, do not use the App.
      </p>

      <h2>2. Eligibility & Minimum Age</h2>
      <p>
        You must be at least 14 years old to register and use the App. By registering
        you confirm that you are 14 or older. We may terminate accounts
        suspected of belonging to users under the age of 14.
      </p>
      <p>
        Users aged 14–17 may use the App, but must comply with safety restrictions. Sexual
        content involving minors, exploitation, or any sexual behavior that involves a person
        under 18 is strictly prohibited and will lead to immediate account termination and
        reporting to authorities where applicable.
      </p>

      <h2>3. Accounts & Security</h2>
      <p>
        You must register with accurate information, keep credentials secure, and notify us
        of unauthorized account access. You are responsible for all activity under your account.
      </p>
      <p>
        Email verification and acceptance of these Terms are required before core features
        (such as swiping, matching, and messaging) are enabled.
      </p>

      <h2>4. Prohibited Conduct</h2>
      <ul>
        <li>No harassment, hate speech, threats, bullying or stalking.</li>
        <li>No sexual exploitation, grooming, or sexual content involving minors.</li>
        <li>No illegal activity, trafficking, solicitation, or fraud.</li>
        <li>No spam, bulk messaging or unsolicited commercial activity.</li>
        <li>No impersonation, false information, or bypassing restrictions or rate limits.</li>
      </ul>

      <h2>5. Content, Ownership & License</h2>
      <p>
        You retain intellectual property rights in content you upload. By posting content,
        you grant Rämidate a non-exclusive license to store, display, and distribute your content
        to provide the service. We may remove or refuse content that violates these Terms.
      </p>

      <h2>6. Moderation & Reporting</h2>
      <p>
        We moderate content using manual review. You may report abusive
        behavior or content via in-app tools. We may suspend or permanently delete accounts that
        violate these Terms. When we ban an account we may retain a cryptographic hash of the user's
        email address so that the same email cannot be immediately reused to recreate an account. The
        stored hash is one-way and cannot be used to reconstruct the original email address. We may
        cooperate with law enforcement if required.
      </p>

      <h2>7. Safety & Offline Interactions</h2>
      <p>
        Rämidate does not guarantee the behavior, safety or identity of other users. Exercise
        caution when meeting people offline. If you feel unsafe, contact local authorities.
      </p>

      <h2>8. Privacy Policy</h2>
      <p>
        This section describes how Rämidate collects, uses, stores and shares personal data.
        By accepting the Terms of Service you also accept the Privacy Policy and consent to the
        processing described below.
      </p>

      <h3>Data we collect</h3>
      <ul>
        <li>Account information: email, username, hashed password</li>
        <li>
          Profile data: profile photos, first and last name, bio, birth date, gender, sexual preference, age preferences
        </li>
        <li>Usage and matching data: swipe/match history and message metadata to operate the core service.</li>
        <li>Messages: messages you send and receive are stored to deliver the chat experience.</li>
        <li>Device & analytics data: device metadata, IP addresses and analytics used to monitor service health.</li>
      </ul>

      <h3>How we use your data</h3>
      <ul>
        <li>Provide and operate the core service: matching, messaging and profile management.</li>
        <li>Communication: in-app notifications.</li>
        <li>Security and abuse prevention: detecting suspicious activity, spam, and enforcing our policies.</li>
        <li>Analytics and product improvement: to make the App better and more reliable.</li>
      </ul>

      <h3>Sharing & third-party processors</h3>
      <p>
        We do not share your personal data with third parties for their own use. We may provide your
        email address to an email delivery service when sending email verification.
        These limited disclosures are solely to enable delivery of those emails and are not used for
        profiling or advertising.
      </p>

      <h3>Cookies, tracking & local storage</h3>
      <p>
        We use local storage to provide the site experience and to store session tokens.
      </p>

      <h3>Data retention</h3>
      <p>
        We retain account and profile data while your account is active. When you delete your account,
        we will delete personal data immediately. As noted above, an exception exists for limited,
        one-way identifiers (such as cryptographic email hashes) that we may retain solely for the purpose
        of preventing banned users from recreating accounts; these identifiers cannot be used
        to recover the original data and are retained only as long as necessary for abuse prevention.
      </p>

      <h3>User rights & how to exercise them</h3>
      <p>
        You may request access, correction, deletion, or export of your personal data by contacting
        raemidate@gmail.com.
      </p>

      <h3>Account suspension, appeals & deletion process</h3>
      <p>
        Accounts that violate these Terms may be suspended or terminated. If your account is suspended you may
        contact support to request review or appeal at raemidate@gmail.com.
        When an account is deleted, we follow the retention rules above and assist with data export/deletion requests.
      </p>

      <h3>Your rights</h3>
      <ul>
        <li>Correction: you can correct inaccurate profile information.</li>
        <li>Deletion: you can request deletion of your data and account.</li>
      </ul>

      <h3>Minors</h3>
      <p>
        Users aged 14–17 are allowed to use Rämidate under these Terms but are subject to additional protections.
        We do not allow sexual content involving minors or any exploitation of users under 18. If you are a parent
        or guardian and believe a minor is using our service without consent, contact us so we can investigate.
      </p>

      <h3>Data security & encryption</h3>
      <p>
        We use reasonable technical and organizational measures to help protect personal data. This includes:
        data transport protections (TLS/HTTPS) and encryption of selected sensitive fields before storing them
        in the database. These steps help reduce the risk of unauthorized access to stored personal data.
      </p>
      <p>
        Please be aware that the App must be able to decrypt certain data to provide normal functionality (for example,
        to deliver messages or show profile information). Therefore the App cannot offer a zero‑knowledge guarantee.
      </p>

      <h2>9. Disclaimers & Liability</h2>
      <p>
        The App is provided "as is." To the maximum extent allowed by law, we disclaim all
        warranties. We are not responsible for any direct, indirect, incidental or consequential
        damages arising from use of the App.
      </p>

      <h2>10. Changes to Terms</h2>
      <p>
        We may modify these Terms. We will post changes to the App and update the effective
        date. Material changes will be notified and may require re-acceptance.
      </p>

      <h2>11. Governing Law</h2>
      <p>
        These Terms are governed by the laws of Switzerland. Any disputes will be handled
        according to Swiss law and competent Zurich courts unless otherwise agreed.
      </p>

      <h2>12. Contact</h2>
      <p>
        For support or legal inquiries contact: raemidate@gmail.com
      </p>

      <label>
        <input
          type="checkbox"
          name="accept"
          checked={isChecked}
          onChange={e => setIsChecked(e.target.checked)}
          required
        />
        <span>I have read and agree to the <strong>Terms of Service</strong> and <strong>Privacy Policy</strong> for Rämidate</span>
      </label>
      <br />
      <button
        onClick={() => acceptMutation.mutate()}
        disabled={!isChecked || acceptMutation.isPending}
      >
        {acceptMutation.isPending ? 'Accepting...' : 'Accept Terms & Privacy Policy'}
      </button>
    </>
  );
}

export default TOS;
