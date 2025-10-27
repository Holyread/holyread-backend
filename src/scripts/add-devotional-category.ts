import { DevotionalCategoryModel } from '../models/devotionalCategory.model'
import { LanguageModel } from "../models/language.model"

export async function addDevotionalCategories() {
  try {
    console.log("🚀 Running devotional categories migration...");
    
    // Fetch language IDs
    const languages = await LanguageModel.find({
      code: { $in: ["en", "es"] },
    }).select("_id code");
    
    const englishId = languages.find((l) => l.code === "en")?._id;
    const spanishId = languages.find((l) => l.code === "es")?._id;

    if (!englishId || !spanishId) {
      console.error(
        "⚠️ Languages not found. Skipping dependent migrations. " +
        "Run add-language.script manually if needed."
      );
      return;
    }

    const categories = [
      {
        name: "On Faith",
        image: "url/On_Faith_1721740597799.png",
        description:
          "Faith Series offers 15 daily devotionals that explore the foundational role of faith in the Christian life. Each day, delve into how faith originates, supports spiritual growth, and provides comfort, helping believers trust in God’s perfect timing and love.",
        status: "Active",
        language: englishId,
      },
      {
        name: "Pastors",
        image: "url/For_Pastors_1721740668091.png",
        description:
          "Pastoral Leadership Series provides 15 daily devotionals designed to support and enrich church leaders. Daily topics cover essential aspects like humility, leadership, and community engagement, offering guidance for effective ministry.",
        status: "Active",
        language: englishId,
      },
      {
        name: "Couples",
        image: "url/For_Couples_1721740733055.png",
        description:
          "Couples Series features 15 daily devotionals focused on strengthening relationships through Christian teachings. Topics address the essentials of marriage like forgiveness, unity, and love, helping couples navigate their partnership with grace and faith each day.",
        status: "Active",
        language: englishId,
      },
      {
        name: "Mothers",
        image: "url/For_Mothers_1721740786863.png",
        description:
          "Mothers Series delivers 15 daily devotionals tailored to the unique challenges and joys of motherhood. It covers topics such as the importance of sacrificial love, patience, and spiritual guidance, supporting mothers in their vital role with daily wisdom and encouragement.",
        status: "Active",
        language: englishId,
      },

      // Spanish
      {
        name: "Sobre la Fe",
        image: "url/On_Faith_1721740597799.png",
        description:
          "La Serie de Fe ofrece 15 devocionales diarios que exploran el papel fundamental de la fe en la vida cristiana. Cada día profundiza en cómo la fe se origina, apoya el crecimiento espiritual y brinda consuelo, ayudando a los creyentes a confiar en el tiempo y el amor perfectos de Dios.",
        status: "Active",
        language: spanishId,
      },
      {
        name: "Pastores",
        image: "url/For_Pastors_1721740668091.png",
        description:
          "La Serie de Liderazgo Pastoral ofrece 15 devocionales diarios diseñados para apoyar y enriquecer a los líderes de la iglesia. Los temas diarios cubren aspectos esenciales como la humildad, el liderazgo y la participación comunitaria, ofreciendo orientación para un ministerio eficaz.",
        status: "Active",
        language: spanishId,
      },
      {
        name: "Parejas",
        image: "url/For_Couples_1721740733055.png",
        description:
          "La Serie de Parejas presenta 15 devocionales diarios centrados en fortalecer las relaciones a través de las enseñanzas cristianas. Los temas abordan los aspectos esenciales del matrimonio como el perdón, la unidad y el amor, ayudando a las parejas a navegar su relación con gracia y fe cada día.",
        status: "Active",
        language: spanishId,
      },
      {
        name: "Madres",
        image: "url/For_Mothers_1721740786863.png",
        description:
          "La Serie de Madres ofrece 15 devocionales diarios adaptados a los desafíos y alegrías únicos de la maternidad. Cubre temas como la importancia del amor sacrificial, la paciencia y la guía espiritual, apoyando a las madres en su papel vital con sabiduría y ánimo diarios.",
        status: "Active",
        language: spanishId,
      },
    ];

    // 3️⃣ Check which categories already exist
    const existing = await DevotionalCategoryModel.find({}, "name");
    const existingNames = new Set(existing.map((e) => e.name));

    const toInsert = categories.filter((c) => !existingNames.has(c.name));

    // 4️⃣ Conditionally insert
    if (toInsert.length === 0) {
      console.log(
        "⚠️ All devotional categories already exist. Skipping migration."
      );
      return;
    }

    await DevotionalCategoryModel.insertMany(toInsert);
    console.log(`✅ Inserted ${toInsert.length} new devotional categories.`);
  } catch (err) {
    console.error("❌ Migration failed:", err);
  }
}
