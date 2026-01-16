/**
 * Quick Connect Page
 * 
 * Standalone page for the seamless app connection experience.
 * This is FLOW's core promise delivery point.
 */

import { QuickConnectFlow } from '@/components/connection/QuickConnectFlow';

const QuickConnectPage = () => {
  return <QuickConnectFlow showSkip={true} />;
};

export default QuickConnectPage;
