import { Link } from "wouter";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
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
  Clock,
  UploadCloud,
  Palette,
  Lock, // Added
  Scan  // Added
} from "lucide-react";
import { useRef, useState, useEffect } from "react";

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
    <section ref={ref} className="relative min-h-[calc(100vh-124px)] flex items-center justify-center overflow-hidden bg-black">
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-primary/10 via-black to-black"
        style={{ y }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

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
          className="relative max-w-6xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-border/50"
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent z-10 pointer-events-none" />
          <ReactCompareSlider
            itemOne={
              <ReactCompareSliderImage
                src="https://res.cloudinary.com/olilepage/image/upload/q_auto:best/v1768703379/room-scene-update/maax-tori-6732-mt-wh-front-deco-scandinavian-ultra-4k-ar-16-9.webp"
                alt="Original room"
                className="object-cover w-full h-full"
                style={{ 
                  imageRendering: 'auto',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'translate3d(0, 0, 0)'
                }}
              />
            }
            itemTwo={
              <ReactCompareSliderImage
                src="https://res.cloudinary.com/olilepage/image/upload/q_auto:best/v1768703253/room-scene-update/maax-tori-6732-mt-wh-front-deco-mountain-modern-ultra-4k-ar-16-9.webp"
                alt="Redesigned room"
                className="object-cover w-full h-full"
                style={{ 
                  imageRendering: 'auto',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'translate3d(0, 0, 0)'
                }}
              />
            }
            className="w-full h-full"
            style={{ 
              willChange: 'transform',
              WebkitFontSmoothing: 'antialiased'
            }}
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

function SmartLockSection() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const rotationImages = [
    "https://res.cloudinary.com/olilepage/image/upload/q_auto:best,dpr_auto/v1768767323/room-scene-update/matte-black-kitchen-pull-down-faucet-modern-ultra-4k-ar-1-1.jpg",
    "https://res.cloudinary.com/olilepage/image/upload/q_auto:best,dpr_auto/v1768767323/room-scene-update/matte-black-kitchen-pull-down-faucet-modern-farmhouse-ultra-4k-ar-1-1.jpg",
    "https://res.cloudinary.com/olilepage/image/upload/q_auto:best,dpr_auto/v1768767322/room-scene-update/matte-black-kitchen-pull-down-faucet-soft-modern-ultra-4k-ar-1-1.jpg",
    "https://res.cloudinary.com/olilepage/image/upload/q_auto:best,dpr_auto/v1768767323/room-scene-update/matte-black-kitchen-pull-down-faucet-dark-scandi-ultra-4k-ar-1-1.jpg",
    "https://res.cloudinary.com/olilepage/image/upload/q_auto:best,dpr_auto/v1768767323/room-scene-update/matte-black-kitchen-pull-down-faucet-japandi-ultra-4k-ar-1-1.jpg"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % rotationImages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [rotationImages.length]);

  return (
    <section className="py-24 relative overflow-hidden bg-muted/5">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text Content */}
          <motion.div
             initial={{ opacity: 0, x: -30 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6 }}
          >
             <Badge variant="secondary" className="mb-6 text-primary border-primary/20">
               <Lock className="w-3 h-3 mr-2" />
               Precision Control
             </Badge>
             <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
               Keep what you love. <br/>
               <span className="text-muted-foreground">Change the rest.</span>
             </h2>
             <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
               Most AI tools wipe the slate clean. We give you control. 
               Simply click to <strong>lock</strong> your favorite furniture, cabinets, or architectural details. 
               Our AI intelligently redesigns the room around them, blending new styles with your existing treasures.
             </p>

             <div className="space-y-4">
               {['Preserve expensive fixtures', 'Keep structural elements', 'Mix old charm with new styles'].map((item, i) => (
                 <div key={i} className="flex items-center gap-3">
                   <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                     <Check className="w-3.5 h-3.5 text-primary" />
                   </div>
                   <span className="font-medium text-foreground/80">{item}</span>
                 </div>
               ))}
             </div>
          </motion.div>

          {/* Visual Animation */}
          <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             transition={{ duration: 0.8 }}
             className="relative"
          >
             <div className="relative aspect-square rounded-2xl overflow-hidden border border-border/50 shadow-2xl bg-black">

                <AnimatePresence mode="popLayout">
                  <motion.img
                    key={currentImageIndex}
                    src={rotationImages[currentImageIndex]}
                    alt="Room Style Variation"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </AnimatePresence>

                <div className="absolute inset-0 bg-black/10 pointer-events-none" />

                {/* "Locked" UI Element */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-20">
                   {/* Pulse Effect - Uniform all around */}
                   <div className="absolute inset-0 bg-primary/40 rounded-full animate-ping opacity-50" />

                   {/* Lock Badge */}
                   <div className="relative bg-background/90 backdrop-blur-md border border-primary/50 text-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                     <Lock className="w-4 h-4 text-primary" />
                     <span className="text-sm font-semibold">Locked: Faucet</span>
                   </div>

                   {/* Removed scanning line to eliminate bottom artifact */}
                </div>

                <div className="absolute bottom-4 left-4 z-20">
                   <Badge className="bg-black/60 backdrop-blur-md border-white/10 text-white">
                      Generating Style {currentImageIndex + 1} of 5...
                   </Badge>
                </div>
             </div>

             <div className="absolute -inset-4 bg-primary/20 rounded-3xl blur-3xl -z-10 opacity-50" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      title: "Upload Photo",
      desc: "Snap a photo of your room or upload an existing image. We support all standard formats including JPG and PNG.",
      icon: UploadCloud,
      delay: 0
    },
    {
      num: "02",
      title: "Select Style",
      desc: "Choose from our library of 15+ professional styles, from Modern Minimalist to Industrial Chic.",
      icon: Palette,
      delay: 0.2
    },
    {
      num: "03",
      title: "Generate",
      desc: "Our AI analyzes your room's geometry and lighting to render a photorealistic transformation in seconds.",
      icon: Zap,
      delay: 0.4
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-muted/20 to-black/5" />
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />

      <div className="relative max-w-7xl mx-auto px-4">
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="outline" className="mb-4">Simple Workflow</Badge>
          <h2 className="text-3xl md:text-5xl font-bold">
            From Photo to Dream Room
            <br />
            <span className="text-muted-foreground">In Three Simple Steps</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting Line (Desktop Only) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-border/0 via-border to-border/0 z-0" />

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: step.delay }}
              className="relative z-10 group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-2xl bg-card border border-border/50 shadow-xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <step.icon className="w-10 h-10 text-primary" />
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold font-mono">
                    {step.num}
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-4">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed max-w-xs">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GallerySection() {
  const [activeIndex, setActiveIndex] = useState(0);

  const images = [
    { 
      src: "https://res.cloudinary.com/olilepage/image/upload/q_auto:best,dpr_auto/v1768705684/room-scene-update/floating-vanity-walnut-brown-modern-ultra-4k-ar-16-9.jpg", 
      style: "Modern Minimalist", 
      desc: "Clean lines and uncluttered spaces." 
    },
    { 
      src: "https://res.cloudinary.com/olilepage/image/upload/q_auto:best,dpr_auto/v1768705684/room-scene-update/floating-vanity-walnut-brown-contemporary-ultra-4k-ar-16-9.jpg", 
      style: "Contemporary Warmth", 
      desc: "Bold textures meeting soft lighting." 
    },
    { 
      src: "https://res.cloudinary.com/olilepage/image/upload/q_auto:best,dpr_auto/v1768705685/room-scene-update/floating-vanity-walnut-brown-industrial-chic-ultra-4k-ar-16-9.jpg", 
      style: "Industrial Chic", 
      desc: "Raw materials with refined finishes." 
    },
    { 
      src: "https://res.cloudinary.com/olilepage/image/upload/q_auto:best,dpr_auto/v1768705685/room-scene-update/floating-vanity-walnut-brown-japandi-ultra-4k-ar-16-9.jpg", 
      style: "Japandi Balance", 
      desc: "The harmony of Japanese and Nordic design." 
    },
    { 
      src: "https://res.cloudinary.com/olilepage/image/upload/q_auto:best,dpr_auto/v1768705685/room-scene-update/floating-vanity-walnut-brown-zen-spa-ultra-4k-ar-16-9.jpg", 
      style: "Zen Sanctuary", 
      desc: "A peaceful retreat for mind and body." 
    },
    { 
      src: "https://res.cloudinary.com/olilepage/image/upload/q_auto:best,dpr_auto/v1768705815/room-scene-update/floating-vanity-walnut-brown-organic-modern-ultra-4k-ar-16-9.jpg", 
      style: "Organic Modern", 
      desc: "Nature-inspired tones and curves." 
    },
  ];

  return (
    <section id="gallery" className="py-24 relative overflow-hidden bg-black/5">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8">

        {/* Header - Updated to be Centered with New Text */}
        <div className="flex flex-col items-center justify-center mb-12 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              One Room. Endless Styles.
            </h2>
            <p className="text-muted-foreground text-lg">
              Explore our library of 15+ design aesthetics. Here are just a few possibilities.
            </p>
          </motion.div>
        </div>

        {/* Desktop View (Interactive Cinema Container) */}
        <div className="hidden lg:grid grid-cols-12 gap-6 h-[750px]">
          {/* Navigation Menu (Left) */}
          <div className="col-span-4 flex flex-col justify-center space-y-2 pr-4 z-10">
             {images.map((img, index) => (
               <motion.button
                 key={index}
                 initial={{ opacity: 0, x: -20 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 transition={{ delay: index * 0.05 }}
                 viewport={{ once: true }}
                 onClick={() => setActiveIndex(index)}
                 onMouseEnter={() => setActiveIndex(index)}
                 className={`group relative flex flex-col items-start p-6 rounded-xl text-left transition-all duration-300 border ${
                   activeIndex === index 
                     ? 'bg-background border-border shadow-lg scale-[1.02]' 
                     : 'hover:bg-background/50 border-transparent hover:border-border/30 opacity-60 hover:opacity-100'
                 }`}
               >
                 <span className={`text-lg font-bold tracking-tight mb-1 transition-colors ${
                   activeIndex === index ? 'text-primary' : 'text-foreground'
                 }`}>
                   {img.style}
                 </span>
                 <span className="text-sm text-muted-foreground line-clamp-1">
                   {img.desc}
                 </span>

                 {/* Animated Progress Bar for Active State */}
                 {activeIndex === index && (
                   <motion.div 
                     layoutId="active-glow"
                     className="absolute left-0 top-0 w-1 h-full bg-primary rounded-l-xl" 
                   />
                 )}
               </motion.button>
             ))}
          </div>

          {/* Viewport (Right) */}
          <div className="col-span-8 relative rounded-3xl overflow-hidden shadow-2xl border border-border/50 bg-muted">
            <AnimatePresence mode="popLayout">
              <motion.img
                key={activeIndex}
                src={images[activeIndex].src}
                alt={images[activeIndex].style}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  imageRendering: 'auto',
                  transform: 'translate3d(0, 0, 0) scale(1.001)', 
                  willChange: 'transform, opacity'
                }}
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Mobile View (Swipeable Carousel) */}
        <div className="lg:hidden">
          <div className="relative overflow-hidden rounded-2xl border border-border/50 shadow-xl bg-muted">
            <motion.div 
              className="flex"
              drag="x"
              dragConstraints={{ left: -1000, right: 0 }} // Simplified for now, or use a ref
              onDragEnd={(_, info) => {
                const threshold = 50;
                if (info.offset.x < -threshold && activeIndex < images.length - 1) {
                  setActiveIndex(activeIndex + 1);
                } else if (info.offset.x > threshold && activeIndex > 0) {
                  setActiveIndex(activeIndex - 1);
                }
              }}
              animate={{ x: -activeIndex * 100 + "%" }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
            >
              {images.map((img, index) => (
                <div key={index} className="min-w-full flex flex-col">
                  <div className="aspect-video relative">
                    <img 
                      src={img.src} 
                      alt={img.style} 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  </div>
                  <div className="p-6 bg-background border-t">
                    <h3 className="text-xl font-bold text-primary mb-2">{img.style}</h3>
                    <p className="text-muted-foreground">{img.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Swipe Indicator Overlay */}
            <div className="absolute top-4 right-4 z-10">
              <Badge variant="secondary" className="bg-black/40 backdrop-blur-md border-white/10 text-white flex items-center gap-2">
                <motion.div
                  animate={{ x: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Zap className="w-3 h-3" />
                </motion.div>
                Swipe to explore
              </Badge>
            </div>

            {/* Dots Indicator */}
            <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-1.5 z-20 pointer-events-none">
              {images.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activeIndex ? "w-6 bg-primary" : "w-1.5 bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

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
    <footer className="border-t border-white/10 py-12 px-4 bg-black text-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center h-10">
            <img 
              src="https://res.cloudinary.com/olilepage/image/upload/v1768747146/room-scene-update/logos/room-reimagine-logo-walnut-marble-black-background-cropped.jpg" 
              alt="RoomReimagine AI Logo" 
              className="h-full w-auto aspect-[21/9] object-contain opacity-80 hover:opacity-100 transition-opacity"
            />
          </div>

          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/app" className="hover:text-foreground transition-colors" data-testid="footer-link-app">Design App</Link>
            <Link href="/gallery" className="hover:text-foreground transition-colors" data-testid="footer-link-gallery">Gallery</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors" data-testid="footer-link-pricing">Pricing</Link>

            {/* [NEW] Privacy Link */}
            <Link href="/privacy" className="hover:text-foreground transition-colors underline decoration-border hover:decoration-foreground underline-offset-4">
              Privacy & Legal
            </Link>
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
    <div className="min-h-screen bg-background pt-[124px]">
      <HeroSection />
      {/* Inserted SmartLockSection to highlight key feature before process */}
      <SmartLockSection />
      <HowItWorksSection />
      <GallerySection />
      <TestimonialsSection />
      <PricingCTASection />
      <FAQSection />
      <FooterSection />
    </div>
  );
}