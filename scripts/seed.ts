import mongoose from "mongoose";
import type { TopicStatus } from "../src/core/types";
import { connectDB } from "../src/lib/db";
import { Note, Roadmap, Topic, UserSettings } from "../src/lib/models";

async function seed() {
  console.log("🌱 Starting Dhaap Demo Database Seed...");
  await connectDB();

  // Find or use a demo userId
  const settings = await UserSettings.findOne();
  let userId = settings?.userId;

  if (!userId) {
    userId = new mongoose.Types.ObjectId().toString();
    console.log(`Creating default UserSettings for Demo User: ${userId}`);
    await UserSettings.create({
      userId,
      dailyCapMinutes: 240,
      recapCapMinutes: 60,
      passScore: 70,
      restWeekdays: [5, 6], // Friday, Saturday
      reviewWeekday: 0,
      planGenHour: 4,
    });
  } else {
    console.log(`Using existing user: ${userId}`);
  }

  // 1. Create Main Active Roadmap: Docker & Cloud Systems
  let mainRoadmap = await Roadmap.findOne({
    userId,
    roadmapType: "MAIN",
    title: "Docker & Container Engineering",
  });

  if (!mainRoadmap) {
    console.log("Creating Main Roadmap: Docker & Container Engineering");
    mainRoadmap = await Roadmap.create({
      userId,
      title: "Docker & Container Engineering",
      goal: "Master production-grade containerization, multi-stage builds, and Kubernetes orchestration.",
      roadmapType: "MAIN",
      durationMonths: 6,
      urgency: "HIGH",
      isActive: true,
      version: 1,
    });
  }

  // Seed sample topics with chapters, depth guide, real-world knowledge & interview questions
  const sampleTopics: Array<{
    title: string;
    chapter: string;
    description: string;
    orderIndex: number;
    estimatedMinutes: number;
    status: TopicStatus;
    reviewStep: number;
    masteryScore?: number;
    masteryLevel?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
    depthGuide: string;
    realWorldKnowledge: string[];
    keyInterviewQuestions: string[];
  }> = [
    {
      title: "1. Linux Namespaces & Cgroups Internals",
      chapter: "1. Core Foundations",
      description:
        "Deep dive into how container isolation works at the Linux kernel boundary.",
      orderIndex: 0,
      estimatedMinutes: 90,
      status: "MASTERED",
      reviewStep: 6,
      masteryScore: 92,
      masteryLevel: "EXPERT",
      depthGuide:
        "Understand PID, Mount, Net namespaces and memory/cpu throttling with cgroups v2.",
      realWorldKnowledge: [
        "Inspect container isolation using lsns and unshare commands in terminal",
        "Diagnose OOMKilled containers by analyzing memory.max and cgroup thresholds",
      ],
      keyInterviewQuestions: [
        "How is a container different from a lightweight virtual machine at the kernel level?",
        "What happens when a process inside a container hits its memory cgroup limit?",
      ],
    },
    {
      title: "2. Multi-Stage Docker Builds & Layer Optimization",
      chapter: "1. Core Foundations",
      description:
        "Writing minimal, secure production images using build cache invalidation rules.",
      orderIndex: 1,
      estimatedMinutes: 90,
      status: "PASSED",
      reviewStep: 3,
      masteryScore: 84,
      masteryLevel: "ADVANCED",
      depthGuide:
        "Master buildkit cache mounts, non-root users, distroless images, and multi-arch targeting.",
      realWorldKnowledge: [
        "Build a production Next.js Dockerfile with standalone output reducing image from 1.2GB to 80MB",
        "Set up GitHub Actions Docker cache action with type=gha for 10x faster CI builds",
      ],
      keyInterviewQuestions: [
        "Why should you order Dockerfile instructions from least-frequently changed to most-frequently changed?",
        "What security vulnerabilities arise from running container processes as the default root user?",
      ],
    },
    {
      title: "3. Docker Networking & Bridge Architecture",
      chapter: "2. Networking & Composition",
      description:
        "Inter-container communication, overlay networks, and embedded DNS resolution.",
      orderIndex: 2,
      estimatedMinutes: 90,
      status: "LEARNING",
      reviewStep: 1,
      masteryScore: 65,
      masteryLevel: "INTERMEDIATE",
      depthGuide:
        "Understand bridge driver vs host networking, port publishing vs exposing, and iptables NAT rules.",
      realWorldKnowledge: [
        "Configure custom user-defined bridge network for microservices DNS resolution",
        "Debug DNS resolution failures and network latency between Docker containers",
      ],
      keyInterviewQuestions: [
        "Why does embedded DNS resolution work on user-defined bridges but not on default bridge?",
        "How does Docker configure iptables PREROUTING chains for published host ports?",
      ],
    },
    {
      title: "4. Multi-Service Docker Compose with Postgres & Redis",
      chapter: "2. Networking & Composition",
      description:
        "Orchestrating multi-container dependencies, healthchecks, and persistent volumes.",
      orderIndex: 3,
      estimatedMinutes: 75,
      status: "NOT_STARTED",
      reviewStep: 0,
      depthGuide:
        "Master depends_on with condition: service_healthy, named volumes, and environment secrets.",
      realWorldKnowledge: [
        "Create docker-compose.yml with pg_isready healthcheck before backend startup",
        "Manage bind mounts for local hot-reload vs named volumes for persistent database files",
      ],
      keyInterviewQuestions: [
        "Why is depends_on without healthchecks insufficient for database initialization?",
        "How do named volumes persist state across container recreation and pruning?",
      ],
    },
    {
      title: "5. Production Container Security & Scanning",
      chapter: "3. Production & Security",
      description:
        "Hardening containers with read-only root filesystems, capabilities drop, and vulnerability scanning.",
      orderIndex: 4,
      estimatedMinutes: 90,
      status: "NOT_STARTED",
      reviewStep: 0,
      depthGuide:
        "Master Trivy image scanning, dropping ALL Linux capabilities except required, and seccomp profiles.",
      realWorldKnowledge: [
        "Integrate Trivy vulnerability scan into CI pipeline with CRITICAL severity gating",
        "Run container with --read-only and tmpfs for ephemeral writable directories",
      ],
      keyInterviewQuestions: [
        "What Linux capabilities should typically be dropped for a standard web application container?",
        "How do container escape vulnerabilities exploit shared kernel architectures?",
      ],
    },
  ];

  for (const t of sampleTopics) {
    const existing = await Topic.findOne({
      roadmapId: mainRoadmap._id,
      title: t.title,
    });
    if (!existing) {
      const createdTopic = await Topic.create({
        roadmapId: mainRoadmap._id,
        userId,
        ...t,
      });

      // Add a sample note
      await Note.create({
        userId,
        topicId: createdTopic._id.toString(),
        body: `# ${t.title}\n\n## Core Concepts\n- ${t.description}\n\n## Practical Insights\n${t.depthGuide}\n\n\`\`\`bash\n# Example verification\ndocker ps --format "table {{.ID}}\\t{{.Image}}\\t{{.Status}}"\n\`\`\``,
      });

      console.log(`  + Seeded topic: ${t.title}`);
    }
  }

  // 2. Create Secondary Roadmap: Kafka Event Streaming
  let secondaryRoadmap = await Roadmap.findOne({
    userId,
    roadmapType: "SECONDARY",
    title: "Apache Kafka Event Architecture",
  });

  if (!secondaryRoadmap) {
    console.log("Creating Secondary Roadmap: Apache Kafka Event Architecture");
    secondaryRoadmap = await Roadmap.create({
      userId,
      title: "Apache Kafka Event Architecture",
      goal: "Master distributed commit logs, partition rebalancing, and event-driven architecture.",
      roadmapType: "SECONDARY",
      urgency: "MEDIUM",
      expectedStartDate: "Q3 2026",
      isActive: false,
      marketAnalysis: {
        marketDemand:
          "Very high demand in fintech, scale-ups, and real-time streaming architectures.",
        companyRelevance:
          "Enables decoupled microservices, fault-tolerant event sourcing, and high-throughput pipelines.",
        careerImpact:
          "Essential qualification for Staff / Principal Backend Systems Engineering.",
        recommendedDepth:
          "Understand partition leader election, consumer groups, idempotency, and schema registry.",
      },
    });

    const kafkaTopics = [
      {
        title: "1. Distributed Commit Log & Storage Internals",
        chapter: "1. Kafka Architecture",
        description:
          "Zero-copy reads, OS page cache, and immutable log segments.",
        orderIndex: 0,
        estimatedMinutes: 90,
        depthGuide:
          "Understand sendfile syscall, index files, and segment rolling.",
        realWorldKnowledge: [
          "Inspect Kafka segment .log and .index files in data directory",
        ],
        keyInterviewQuestions: [
          "Why is Kafka so fast despite persisting every message to disk?",
        ],
      },
      {
        title: "2. Consumer Groups & Partition Rebalance Protocol",
        chapter: "1. Kafka Architecture",
        description:
          "Cooperative sticky rebalancing, heartbeat threads, and offset commits.",
        orderIndex: 1,
        estimatedMinutes: 90,
        depthGuide:
          "Master incremental cooperative rebalancing vs eager stop-the-world rebalance.",
        realWorldKnowledge: [
          "Configure group.instance.id for static membership in Kubernetes",
        ],
        keyInterviewQuestions: [
          "What causes consumer group rebalances and how do you minimize them?",
        ],
      },
    ];

    for (const kt of kafkaTopics) {
      await Topic.create({
        roadmapId: secondaryRoadmap._id,
        userId,
        ...kt,
      });
      console.log(`  + Seeded secondary topic: ${kt.title}`);
    }
  }

  console.log("✅ Dhaap Database Seeding Complete! Ready to launch.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
