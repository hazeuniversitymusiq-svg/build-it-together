/**
 * FLOW Bank Partner Pitch Deck
 * 
 * A professional landing page for potential bank partners
 * showcasing FLOW's technical architecture and integration readiness.
 */

import { motion } from 'framer-motion';
import { 
  Building2, 
  Shield, 
  Zap, 
  Users, 
  LineChart, 
  Lock,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  QrCode,
  Fingerprint,
  Database,
  Globe,
  TrendingUp,
  Clock,
  FileCode,
  Server,
  Layers,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { generatePartnerPitchPDF } from '@/lib/pdf/partner-pitch-pdf';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function PartnerPitchPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6 py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.15),transparent_50%)]" />
        
        <motion.div 
          className="relative z-10 max-w-5xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Badge variant="outline" className="mb-6 px-4 py-2 text-sm border-primary/30">
            <Building2 className="w-4 h-4 mr-2 inline" />
            Bank Partnership Opportunity
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="text-primary">FLOW</span> × Your Bank
            <br />
            <span className="text-muted-foreground text-3xl md:text-5xl">
              Unified Payment Orchestration
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Partner with FLOW to deliver seamless "Scan → Authorize → Pay" experiences 
            across Malaysia's fragmented payment ecosystem. One integration. Millions of users.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" onClick={() => document.getElementById('architecture')?.scrollIntoView({ behavior: 'smooth' })}>
              View Architecture
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8" onClick={() => navigate('/demo')}>
              Try Live Demo
            </Button>
          </div>
          
          {/* Download PDF Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6"
          >
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-primary"
              onClick={generatePartnerPitchPDF}
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF Summary
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Partner With FLOW?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Malaysia has 50+ payment apps. Users juggle 3-5 daily. FLOW unifies them all.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                icon: Users,
                title: 'New Customers',
                value: '3M+',
                description: 'Potential user acquisition through unified UX'
              },
              {
                icon: TrendingUp,
                title: 'Transaction Volume',
                value: '40%',
                description: 'Higher completion rates via reduced friction'
              },
              {
                icon: Clock,
                title: 'Time to Pay',
                value: '< 2s',
                description: 'From QR scan to payment confirmation'
              },
              {
                icon: Shield,
                title: 'Security Level',
                value: 'Bank-grade',
                description: 'PCI-DSS ready, biometric-first security'
              }
            ].map((stat, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full bg-card/50 backdrop-blur border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="pt-6">
                    <stat.icon className="w-10 h-10 text-primary mb-4" />
                    <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
                    <div className="font-semibold mb-2">{stat.title}</div>
                    <p className="text-sm text-muted-foreground">{stat.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Architecture Section */}
      <section id="architecture" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Badge variant="secondary" className="mb-4">Technical Architecture</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Production-Ready Infrastructure</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Built on proven technology. Ready for bank-grade integration.
            </p>
          </motion.div>

          {/* Architecture Diagram */}
          <motion.div 
            className="relative mb-16"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Card className="bg-card/80 backdrop-blur border-border overflow-hidden">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-3 gap-8">
                  {/* User Layer */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <Smartphone className="w-5 h-5" />
                      User Layer
                    </div>
                    <div className="bg-primary/10 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <QrCode className="w-4 h-4" />
                        QR Scanner (EMVCo)
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Fingerprint className="w-4 h-4" />
                        Biometric Auth
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Layers className="w-4 h-4" />
                        Resolution Engine
                      </div>
                    </div>
                  </div>

                  {/* FLOW Backend */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <Server className="w-5 h-5" />
                      FLOW Backend
                    </div>
                    <div className="bg-primary/10 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Lock className="w-4 h-4" />
                        OAuth 2.0 + PKCE
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Database className="w-4 h-4" />
                        Intent & Plan Store
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <FileCode className="w-4 h-4" />
                        Transaction Signing
                      </div>
                    </div>
                  </div>

                  {/* Bank Integration */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <Building2 className="w-5 h-5" />
                      Bank Partner APIs
                    </div>
                    <div className="bg-primary/10 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="w-4 h-4" />
                        GET /balance
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className="w-4 h-4" />
                        POST /payments
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <LineChart className="w-4 h-4" />
                        GET /transactions
                      </div>
                    </div>
                  </div>
                </div>

                {/* Flow arrows */}
                <div className="hidden md:flex justify-center items-center mt-8 text-muted-foreground">
                  <span className="text-sm">Scan</span>
                  <ArrowRight className="mx-2 w-4 h-4" />
                  <span className="text-sm">Resolve</span>
                  <ArrowRight className="mx-2 w-4 h-4" />
                  <span className="text-sm">Authorize</span>
                  <ArrowRight className="mx-2 w-4 h-4" />
                  <span className="text-sm">Execute</span>
                  <ArrowRight className="mx-2 w-4 h-4" />
                  <span className="text-sm text-primary font-semibold">Done ✓</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Core Components */}
          <motion.div 
            className="grid md:grid-cols-2 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                title: 'Resolution Engine',
                description: 'Smart payment routing based on user preferences, balance, and guardrails',
                features: ['Rule-based resolution', 'Fallback preferences', 'Auto top-up logic', 'Risk scoring'],
                status: 'Production Ready'
              },
              {
                title: 'Security Layer',
                description: '4-layer security architecture with biometric-first authentication',
                features: ['Device attestation', 'HMAC signatures', 'Audit chain logging', 'Rate limiting'],
                status: 'Production Ready'
              },
              {
                title: 'Orchestration',
                description: 'Intent → Plan → Execute flow with full state management',
                features: ['Intent parsing', 'Plan generation', 'Execution tracking', 'Webhook handlers'],
                status: 'Production Ready'
              },
              {
                title: 'Bank Integration',
                description: 'Open Banking compliant API specification ready for implementation',
                features: ['OAuth 2.0 flows', 'Balance queries', 'Payment initiation', 'Transaction history'],
                status: 'Spec Complete'
              }
            ].map((component, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full bg-card/50 backdrop-blur hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-xl">{component.title}</CardTitle>
                      <Badge variant={component.status === 'Production Ready' ? 'default' : 'secondary'} className="text-xs">
                        {component.status}
                      </Badge>
                    </div>
                    <CardDescription>{component.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {component.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* API Requirements */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Badge variant="secondary" className="mb-4">Integration Requirements</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What We Need From You</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Just 4 API endpoints to power millions of seamless payments
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 gap-6 mb-12"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                method: 'GET',
                endpoint: '/api/v1/accounts/{id}/balance',
                description: 'Real-time balance inquiry for payment resolution',
                latency: '< 100ms'
              },
              {
                method: 'POST',
                endpoint: '/api/v1/payments/initiate',
                description: 'Initiate DuitNow QR or instant transfer payment',
                latency: '< 500ms'
              },
              {
                method: 'GET',
                endpoint: '/api/v1/payments/{id}/status',
                description: 'Check payment status and retrieve receipt',
                latency: '< 100ms'
              },
              {
                method: 'GET',
                endpoint: '/api/v1/accounts/{id}/transactions',
                description: 'Transaction history for spending insights',
                latency: '< 200ms'
              }
            ].map((api, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="bg-card/50 backdrop-blur border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Badge 
                        variant={api.method === 'GET' ? 'secondary' : 'default'}
                        className="font-mono"
                      >
                        {api.method}
                      </Badge>
                      <div className="flex-1">
                        <code className="text-sm font-mono text-primary break-all">
                          {api.endpoint}
                        </code>
                        <p className="text-sm text-muted-foreground mt-2">{api.description}</p>
                        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          Expected latency: {api.latency}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Security Requirements */}
          <Card className="bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Security & Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Authentication</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      OAuth 2.0 + PKCE
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      JWT with RS256 signing
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      15-min access token expiry
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Transport</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      TLS 1.3 required
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Certificate pinning
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Request signing
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Compliance</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      PCI-DSS ready
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      PDPA compliant
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      BNM guidelines
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Partnership Models */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Badge variant="secondary" className="mb-4">Partnership Models</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Flexible Integration Options</h2>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                title: 'White-Label',
                description: 'Deploy FLOW as your own branded payment app',
                features: [
                  'Your branding & UX',
                  'Full feature access',
                  'Dedicated support',
                  'Revenue share model'
                ],
                highlight: true
              },
              {
                title: 'API Partner',
                description: 'Provide API infrastructure for FLOW users',
                features: [
                  'Standard API integration',
                  'Transaction fees',
                  'User acquisition',
                  'Co-marketing'
                ],
                highlight: false
              },
              {
                title: 'Pilot Program',
                description: 'Start small with 1,000 users',
                features: [
                  'Limited rollout',
                  'RM500 daily limit',
                  'Full metrics access',
                  'No commitment'
                ],
                highlight: false
              }
            ].map((model, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className={`h-full ${model.highlight ? 'border-primary bg-primary/5' : 'bg-card/50'}`}>
                  <CardHeader>
                    {model.highlight && (
                      <Badge className="w-fit mb-2">Recommended</Badge>
                    )}
                    <CardTitle>{model.title}</CardTitle>
                    <CardDescription>{model.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {model.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Payments?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join us in building Malaysia's unified payment future. 
              Technical documentation and sandbox access available.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8" onClick={() => navigate('/demo')}>
                Experience the Demo
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" onClick={() => navigate('/')}>
                Back to FLOW
              </Button>
            </div>
            
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Full API spec available
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Sandbox ready
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Technical team on standby
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div>© 2025 FLOW Payment Orchestration</div>
          <div className="flex gap-6">
            <span>Partnership Inquiries: partners@flow.my</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
