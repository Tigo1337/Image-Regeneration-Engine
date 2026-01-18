import { Link } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  ArrowRight, 
  Wand2, 
  Crop, 
  Ruler, 
  Star, 
  Check,
  Zap,
  Shield,
  Clock
} from "lucide-react";
import { useRef } from "react";

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background"
        style={{ y }}
      />
      
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      
      <motion.div 
        className="relative z-10 max-w-7xl mx-auto px-4 py-20 text-center"
        style={{ opacity }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm" data-testid="badge-hero">
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered Interior Design
          </Badge>
        </motion.div>
        
        <motion.h1 
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">
            Transform Your Space
          </span>
          <br />
          <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
            In Seconds
          </span>
        </motion.h1>
        
        <motion.p 
          className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Upload any room photo and watch AI reimagine it in stunning new styles. 
          From modern minimalism to cozy bohemian — see your vision come to life.
        </motion.p>
        
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Button size="lg" className="text-lg px-8 py-6" asChild data-testid="button-start-designing">
            <Link href="/app">
              Start Designing Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild data-testid="button-view-gallery">
            <Link href="/gallery">
              View Gallery
            </Link>
          </Button>
        </motion.div>
        
        <motion.div
          className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-border/50"
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent z-10 pointer-events-none" />
          <ReactCompareSlider
            itemOne={
              <ReactCompareSliderImage
                src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop"
                alt="Original room"
              />
            }
            itemTwo={
              <ReactCompareSliderImage
                src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&h=800&fit=crop"
                alt="Redesigned room"
              />
            }
            className="aspect-video"
          />
          <div className="absolute bottom-4 left-4 z-20">
            <Badge variant="secondary" className="backdrop-blur-sm">Before</Badge>
          </div>
          <div className="absolute bottom-4 right-4 z-20">
            <Badge className="backdrop-blur-sm">After</Badge>
          </div>
        </motion.div>
      </motion.div>
      
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-muted-foreground"
        >
          <div className="w-6 h-10 border-2 border-muted-foreground/50 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-muted-foreground/50 rounded-full" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features: Array<{
    icon: typeof Wand2;
    title: string;
    description: string;
    gradient: string;
  }> = [
    {
      icon: Wand2,
      title: "Room Redesign",
      description: "Transform any room with 15+ design styles. From Modern to Bohemian, Mid-Century to Industrial — instantly visualize your dream space.",
      gradient: "from-violet-500 to-purple-500"
    },
    {
      icon: Crop,
      title: "Smart Crop",
      description: "Intelligent object detection and background removal. Isolate furniture, decor, or architectural elements with pixel-perfect precision.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Ruler,
      title: "Dimensional Images",
      description: "Add professional dimension lines and measurements to your designs. Perfect for presentations, client proposals, and planning.",
      gradient: "from-orange-500 to-amber-500"
    }
  ];

  return (
    <section id="features" className="py-32 px-4 relative overflow-hidden scroll-mt-20">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
      
      <div className="relative max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="outline" className="mb-4">Features</Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Everything You Need to
            <br />
            <span className="text-primary">Visualize Perfect Spaces</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional-grade AI tools that turn your interior design ideas into stunning, photorealistic visualizations.
          </p>
        </motion.div>
        
        <motion.div 
          className="grid md:grid-cols-3 gap-8"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={fadeInUp}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm hover-elevate" data-testid={`card-feature-${index}`}>
                <CardContent className="p-8">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function GallerySection() {
  const images = [
    { src: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&h=400&fit=crop", style: "Modern" },
    { src: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&h=400&fit=crop", style: "Scandinavian" },
    { src: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&h=400&fit=crop", style: "Industrial" },
    { src: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&h=400&fit=crop", style: "Minimalist" },
    { src: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=400&fit=crop", style: "Contemporary" },
    { src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop", style: "Bohemian" },
  ];

  return (
    <section id="gallery" className="py-32 px-4 relative scroll-mt-20">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="outline" className="mb-4">Gallery</Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Stunning Transformations
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See what's possible with AI-powered interior design. Every image created in seconds.
          </p>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          {images.map((image, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="relative group overflow-hidden rounded-xl"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
              data-testid={`gallery-image-${index}`}
            >
              <img 
                src={image.src} 
                alt={`${image.style} room design`}
                className="w-full aspect-[3/2] object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Badge className="backdrop-blur-sm">{image.style}</Badge>
              </div>
            </motion.div>
          ))}
        </motion.div>
        
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <Button size="lg" variant="outline" asChild data-testid="button-view-more-gallery">
            <Link href="/gallery">
              View Full Gallery
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Interior Designer",
      avatar: "SC",
      content: "RoomReimagine has completely transformed my client presentations. I can now show multiple design concepts in minutes instead of days.",
      rating: 5
    },
    {
      name: "Marcus Johnson",
      role: "Real Estate Agent",
      avatar: "MJ",
      content: "The virtual staging capabilities are incredible. My listings with AI-redesigned photos get 3x more engagement.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Homeowner",
      avatar: "ER",
      content: "I was skeptical at first, but seeing my living room in 10 different styles helped me finally decide on my renovation direction.",
      rating: 5
    }
  ];

  const stats = [
    { value: "50K+", label: "Rooms Transformed" },
    { value: "15+", label: "Design Styles" },
    { value: "4.9", label: "User Rating" },
    { value: "<10s", label: "Generation Time" },
  ];

  return (
    <section className="py-32 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
      
      <div className="relative max-w-7xl mx-auto">
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          {stats.map((stat, index) => (
            <motion.div 
              key={stat.label}
              variants={fadeInUp}
              className="text-center"
              data-testid={`stat-${index}`}
            >
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{stat.value}</div>
              <div className="text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
        
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="outline" className="mb-4">Testimonials</Badge>
          <h2 className="text-4xl md:text-5xl font-bold">
            Loved by Designers & Homeowners
          </h2>
        </motion.div>
        
        <motion.div 
          className="grid md:grid-cols-3 gap-8"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div key={testimonial.name} variants={fadeInUp}>
              <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm" data-testid={`testimonial-${index}`}>
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-lg mb-6 leading-relaxed">"{testimonial.content}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-primary">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function PricingCTASection() {
  const benefits = [
    "Unlimited room redesigns",
    "All 15+ design styles",
    "Smart Crop & Dimensional tools",
    "High-resolution exports",
    "Priority AI processing",
    "Commercial usage rights"
  ];

  return (
    <section className="py-32 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
      
      <motion.div 
        className="relative max-w-4xl mx-auto text-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <Badge className="mb-6">Pro Plan</Badge>
        <h2 className="text-4xl md:text-6xl font-bold mb-6">
          Start Creating Today
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join thousands of designers, agents, and homeowners transforming spaces with AI.
        </p>
        
        <div className="flex flex-col items-center mb-10">
          <div className="text-5xl font-bold mb-2">
            $29<span className="text-xl font-normal text-muted-foreground">/month</span>
          </div>
          <p className="text-muted-foreground">+ usage-based billing for generations</p>
        </div>
        
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10 max-w-2xl mx-auto"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          {benefits.map((benefit, index) => (
            <motion.div 
              key={benefit}
              variants={fadeInUp}
              className="flex items-center gap-2 text-left"
              data-testid={`benefit-${index}`}
            >
              <Check className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-sm">{benefit}</span>
            </motion.div>
          ))}
        </motion.div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="text-lg px-10 py-6" asChild data-testid="button-get-started-pricing">
            <Link href="/pricing">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-10 py-6" asChild data-testid="button-try-free">
            <Link href="/app">
              Try Free First
            </Link>
          </Button>
        </div>
        
        <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Instant setup
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Cancel anytime
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            7-day trial
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    {
      question: "How does AI room redesign work?",
      answer: "Simply upload a photo of any room, select your desired style, and our AI will generate a photorealistic visualization of your space in that new style. The AI preserves the room's structure while transforming the decor, furniture, and overall aesthetic."
    },
    {
      question: "What image quality can I expect?",
      answer: "We offer three quality tiers: Standard (fast previews), High Fidelity 2K (detailed renders), and Ultra 4K (professional-grade). All outputs are photorealistic and suitable for presentations, client proposals, and marketing materials."
    },
    {
      question: "Can I use the generated images commercially?",
      answer: "Yes! Pro subscribers have full commercial usage rights for all generated images. Use them for client presentations, marketing materials, social media, or any business purpose."
    },
    {
      question: "How is billing calculated?",
      answer: "We use a simple monthly subscription ($29/month) plus usage-based pricing per generated image. Standard quality is $0.20/image, High Fidelity is $0.35, and Ultra 4K is $0.50. You only pay for what you use."
    },
    {
      question: "What design styles are available?",
      answer: "We offer 15+ design styles including Modern, Contemporary, Scandinavian, Industrial, Bohemian, Mid-Century Modern, Minimalist, Traditional, Mediterranean, Art Deco, Rustic, Coastal, Japanese, and more."
    },
    {
      question: "Can I preserve specific objects in my room?",
      answer: "Absolutely! Our AI allows you to specify which elements to keep unchanged during the redesign. Whether it's a cherished piece of furniture or architectural features, you control what stays."
    }
  ];

  return (
    <section className="py-32 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="outline" className="mb-4">FAQ</Badge>
          <h2 className="text-4xl md:text-5xl font-bold">
            Frequently Asked Questions
          </h2>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border rounded-xl px-6 bg-card/50"
                data-testid={`faq-${index}`}
              >
                <AccordionTrigger className="text-left text-lg font-medium py-6 hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}

function FooterSection() {
  return (
    <footer className="border-t py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">RoomReimagine AI</span>
          </div>
          
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/app" className="hover:text-foreground transition-colors" data-testid="footer-link-app">Design App</Link>
            <Link href="/gallery" className="hover:text-foreground transition-colors" data-testid="footer-link-gallery">Gallery</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors" data-testid="footer-link-pricing">Pricing</Link>
          </nav>
          
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} RoomReimagine AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <FeaturesSection />
      <GallerySection />
      <TestimonialsSection />
      <PricingCTASection />
      <FAQSection />
      <FooterSection />
    </div>
  );
}
