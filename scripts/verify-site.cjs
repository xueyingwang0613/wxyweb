const { chromium } = require(
  "/Users/a183/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright"
);
const assert = require("node:assert/strict");

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });

  for (const viewport of [
    { name: "desktop", width: 1440, height: 941 },
    { name: "tablet", width: 1024, height: 923 },
    { name: "compact", width: 768, height: 923 },
    { name: "mobileWide", width: 519, height: 885 },
    { name: "mobile", width: 375, height: 844 },
  ]) {
    const page = await browser.newPage({
      viewport,
      isMobile: viewport.width <= 600,
      hasTouch: viewport.width <= 600,
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://127.0.0.1:4173", { waitUntil: "domcontentloaded" });
    await page.screenshot({ path: `/private/tmp/wxy-${viewport.name}.png`, fullPage: true });

    const metrics = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      title: document.title,
      heroTitle: document.querySelector(".hero h1")?.textContent.replace(/\s+/g, " ").trim(),
      panels: document.querySelectorAll(".panel").length,
      legacyAboutPanels: document.querySelectorAll("section.about").length,
      titleLinesFit: [...document.querySelectorAll(".hero h1 .title-line")].every(
        (line) => line.scrollWidth <= line.clientWidth
      ),
      navContactLinks: [...document.querySelectorAll(".main-nav a")].filter((link) => link.textContent.trim() === "联系我").length,
      contactButtons: document.querySelectorAll(".contact-button").length,
      xhsHeaderHref: document.querySelector(".xhs-contact-button")?.getAttribute("href"),
      legacySkillName: document.body.textContent.includes("Skill & Workflow 模板库"),
      legacyCollaborationTitle: document.body.textContent.includes("合作共创"),
      viewAllLinks: [...document.querySelectorAll(".section-head a")].filter((link) => link.textContent.includes("查看全部")).length,
      navItems: [...document.querySelectorAll(".main-nav a")].map((link) => ({
        text: link.textContent.trim(),
        href: link.getAttribute("href"),
      })),
      sectionHeadings: {
        about: document.querySelector("#about .hero-about h2")?.textContent.trim(),
        products: document.querySelector("#products h2")?.textContent.replace(/\s+/g, " ").trim(),
        skill: document.querySelector("#skill h2")?.textContent.trim(),
        lab: document.querySelector("#lab h2")?.textContent.trim(),
        collaboration: document.querySelector("#collaboration h2")?.textContent.trim(),
        notes: document.querySelector("#notes h2")?.textContent.trim(),
      },
      products: [...document.querySelectorAll("#products .product-card")].map((card) => ({
        title: card.querySelector("h3")?.textContent.trim(),
        href: card.getAttribute("href"),
      })),
      services: [...document.querySelectorAll("#collaboration .service-card")].map((card) => ({
        title: card.querySelector("strong")?.textContent.trim(),
        href: card.getAttribute("href"),
        desc: card.querySelector(".service-desc")?.textContent.trim(),
        tags: [...card.querySelectorAll(".service-tags span")].map((tag) => tag.textContent.trim()),
      })),
      xhsServiceIconLoaded: document.querySelector(".service-coral .service-icon img")?.naturalWidth > 0,
      productsTop: Math.round(document.querySelector("#products").getBoundingClientRect().top),
    }));
    assert.equal(metrics.scrollWidth, metrics.innerWidth, `${viewport.name}: horizontal overflow`);
    assert.equal(metrics.heroTitle, "AI 产品经理的个人实践档案馆", `${viewport.name}: hero title copy mismatch`);
    assert.equal(metrics.panels, 6, `${viewport.name}: missing content panels`);
    assert.equal(metrics.legacyAboutPanels, 0, `${viewport.name}: legacy about panel still exists`);
    assert.equal(metrics.titleLinesFit, true, `${viewport.name}: hero title wraps or overflows`);
    assert.equal(metrics.navContactLinks, 0, `${viewport.name}: duplicate contact nav link still exists`);
    assert.equal(metrics.contactButtons, 2, `${viewport.name}: should have WeChat and XHS contact buttons`);
    assert.equal(metrics.xhsHeaderHref, "https://www.xiaohongshu.com/user/profile/643812aa000000001002a145", `${viewport.name}: header XHS link mismatch`);
    assert.equal(metrics.legacySkillName, false, `${viewport.name}: legacy Skill & Workflow title still exists`);
    assert.equal(metrics.legacyCollaborationTitle, false, `${viewport.name}: legacy collaboration title still exists`);
    assert.equal(metrics.viewAllLinks, 0, `${viewport.name}: view-all links should be removed`);
    assert.deepEqual(metrics.navItems, [
      { text: "关于我", href: "#about" },
      { text: "AI 产品", href: "#products" },
      { text: "Skill", href: "#skill" },
      { text: "Vibe Coding Lab", href: "#lab" },
      { text: "服务与合作", href: "#collaboration" },
      { text: "最近的笔记", href: "#notes" },
    ], `${viewport.name}: nav items should match visible sections`);
    assert.deepEqual(metrics.sectionHeadings, {
      about: "关于我",
      products: "AI 产品",
      skill: "Skill",
      lab: "Vibe Coding Lab",
      collaboration: "服务与合作",
      notes: "最近的笔记",
    }, `${viewport.name}: section headings should match nav labels`);
    assert.deepEqual(metrics.products, [
      { title: "AI 策略助手", href: "https://my.feishu.cn/wiki/MxdXwlvxJiXcrykoYDNc2BCWnMk" },
      { title: "达人 Brief 生成", href: "https://my.feishu.cn/wiki/TNutwqWo2i0j0Wk3esqcI6mOnef" },
      { title: "内容生成", href: "https://my.feishu.cn/wiki/PG12wPASEiDEcAkwZiPcgi78nge" },
      { title: "结案报告", href: "https://my.feishu.cn/wiki/ZmfWw6DgyilDbBkk66ucCSM7nJg" },
    ], `${viewport.name}: AI product cards mismatch`);
    assert.deepEqual(metrics.services, [
      { title: "小红书营销", href: "#contact", desc: "从策略到内容，帮助品牌做好小红书营销。", tags: ["账号定位", "选题策划", "内容生产", "项目复盘"] },
      { title: "AI 海报制作", href: "#contact", desc: "快速完成兼顾效果与效率的视觉设计。", tags: ["活动海报", "宣传长图", "小红书封面", "电商视觉"] },
      { title: "AI 培训与分享", href: "#contact", desc: "结合真实业务场景，帮助团队真正用好 AI。", tags: ["企业培训", "主题分享", "工具实操", "工作流搭建"] },
      { title: "AI 产品与企业落地", href: "#contact", desc: "把复杂业务需求拆解成可落地的 AI 产品方案。", tags: ["场景梳理", "Agent 设计", "流程自动化", "产品咨询"] },
    ], `${viewport.name}: service cards mismatch`);
    assert.equal(metrics.xhsServiceIconLoaded, true, `${viewport.name}: xhs service icon should load`);
    if (viewport.name === "compact") {
      assert.ok(metrics.productsTop < viewport.height, "compact: AI products should be visible in the first viewport");
    }
    assert.equal(errors.length, 0, `${viewport.name}: ${errors.join(", ")}`);

    const serviceLayout = await page.evaluate(() => {
      const section = document.querySelector("#collaboration");
      const intro = document.querySelector(".service-intro");
      const grid = document.querySelector(".service-grid");
      const cards = [...document.querySelectorAll(".service-card")].map((card) => {
        const rect = card.getBoundingClientRect();
        const title = card.querySelector("strong").getBoundingClientRect();
        const desc = card.querySelector(".service-desc").getBoundingClientRect();
        const tags = card.querySelector(".service-tags").getBoundingClientRect();
        const tagItems = [...card.querySelectorAll(".service-tags span")].map((tag) => tag.getBoundingClientRect());
        return {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
          titleLeft: title.left,
          titleTop: title.top,
          descHeight: desc.height,
          tagsBottom: rect.bottom - tags.bottom,
          tagRows: new Set(tagItems.map((tag) => Math.round(tag.top))).size,
        };
      });
      const sectionRect = section.getBoundingClientRect();
      const introRect = intro.getBoundingClientRect();
      const gridRect = grid.getBoundingClientRect();
      return {
        sectionWidth: sectionRect.width,
        introTop: introRect.top,
        introBottom: introRect.bottom,
        gridTop: gridRect.top,
        gridBottom: gridRect.bottom,
        introLeft: introRect.left,
        gridLeft: gridRect.left,
        cards,
        cardWidthDelta: Math.max(...cards.map((card) => card.width)) - Math.min(...cards.map((card) => card.width)),
        cardHeightDelta: Math.max(...cards.map((card) => card.height)) - Math.min(...cards.map((card) => card.height)),
        cardTitleLeftDelta: Math.max(...cards.map((card) => card.titleLeft - card.left)) - Math.min(...cards.map((card) => card.titleLeft - card.left)),
        cardTitleTopDelta: Math.max(...cards.map((card) => card.titleTop - card.top)) - Math.min(...cards.map((card) => card.titleTop - card.top)),
        cardDescHeightDelta: Math.max(...cards.map((card) => card.descHeight)) - Math.min(...cards.map((card) => card.descHeight)),
        cardTagsBottomDelta: Math.max(...cards.map((card) => card.tagsBottom)) - Math.min(...cards.map((card) => card.tagsBottom)),
      };
    });
    assert.ok(serviceLayout.cardWidthDelta <= 1, `${viewport.name}: service cards should share width`);
    assert.ok(serviceLayout.cardTitleLeftDelta <= 1, `${viewport.name}: service card text columns should align`);
    assert.ok(serviceLayout.cardTitleTopDelta <= 1, `${viewport.name}: service card titles should align`);
    assert.ok(serviceLayout.cardDescHeightDelta <= 1, `${viewport.name}: service descriptions should reserve equal height`);
    assert.ok(serviceLayout.cardTagsBottomDelta <= 1, `${viewport.name}: service tags should align to bottom`);
    assert.ok(serviceLayout.cards.every((card) => card.tagRows === 2), `${viewport.name}: service tags should render in two rows`);
    if (viewport.width >= 768) {
      assert.ok(serviceLayout.gridLeft > serviceLayout.introLeft, `${viewport.name}: service module should use left intro and right cards`);
      assert.ok(Math.abs(serviceLayout.introTop - serviceLayout.gridTop) <= 1, `${viewport.name}: service intro and card grid should align at top`);
      assert.ok(Math.abs(serviceLayout.introBottom - serviceLayout.gridBottom) <= 1, `${viewport.name}: service intro and card grid should align at bottom`);
      assert.ok(serviceLayout.cardHeightDelta <= 1, `${viewport.name}: service cards should be equal height`);
      assert.ok(Math.abs(serviceLayout.cards[0].top - serviceLayout.cards[1].top) <= 1, `${viewport.name}: first service row should align`);
      assert.ok(Math.abs(serviceLayout.cards[2].top - serviceLayout.cards[3].top) <= 1, `${viewport.name}: second service row should align`);
      assert.ok(serviceLayout.cards[2].top > serviceLayout.cards[0].bottom, `${viewport.name}: service cards should form two rows`);
    } else {
      assert.ok(serviceLayout.cards.every((card, index, cards) => index === 0 || card.top > cards[index - 1].bottom), "mobile: service cards should stack vertically");
    }

    await page.locator(".service-card").first().click();
    await page.waitForTimeout(250);
    await expectVisible(page, ".contact-popover", `${viewport.name}: service card should open contact popover`);
    const contactPopoverLayout = await page.evaluate(() => {
      const popover = document.querySelector(".contact-popover").getBoundingClientRect();
      const button = document.querySelector(".contact-wrapper .contact-button").getBoundingClientRect();
      const cards = [...document.querySelectorAll(".contact-card")].map((card) => {
        const rect = card.getBoundingClientRect();
        const visual = card.querySelector(".contact-visual").getBoundingClientRect();
        const title = card.querySelector("strong").getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width, height: rect.height, visualHeight: visual.height, titleTop: title.top };
      });
      const icon = document.querySelector(".contact-wrapper .contact-button img").getBoundingClientRect();
      const qr = document.querySelector(".contact-card:first-child .contact-visual img").getBoundingClientRect();
      return {
        popoverTop: popover.top,
        popoverLeft: popover.left,
        popoverRight: popover.right,
        popoverWidth: popover.width,
        buttonBottom: button.bottom,
        buttonRight: button.right,
        iconWidth: icon.width,
        iconHeight: icon.height,
        cards,
        qrTop: qr.top,
        qrBottom: qr.bottom,
      };
    });
    assert.equal(contactPopoverLayout.cards.length, 1, `${viewport.name}: WeChat popover should only contain the QR card`);
    if (viewport.width > 768) {
      assert.ok(Math.abs(contactPopoverLayout.popoverWidth - 220) <= 1, `${viewport.name}: desktop WeChat popover should be compact`);
      assert.ok(Math.abs(contactPopoverLayout.popoverRight - contactPopoverLayout.buttonRight) <= 1, `${viewport.name}: contact popover should align to button right`);
      assert.ok(Math.abs(contactPopoverLayout.popoverTop - contactPopoverLayout.buttonBottom - 12) <= 2, `${viewport.name}: contact popover should sit 12px below button`);
    } else {
      assert.ok(contactPopoverLayout.popoverWidth <= 221, `${viewport.name}: mobile WeChat popover should stay compact`);
      assert.ok(contactPopoverLayout.popoverRight <= viewport.width - 11, `${viewport.name}: mobile contact popover should have right margin`);
    }
    const expectedContactIconSize = viewport.width <= 600 ? 41 : 43;
    assert.ok(contactPopoverLayout.iconWidth >= expectedContactIconSize && contactPopoverLayout.iconHeight >= expectedContactIconSize, `${viewport.name}: WeChat contact icon should fill the circle`);
    assert.ok(contactPopoverLayout.cards.every((card) => card.visualHeight <= 181), `${viewport.name}: contact visuals should not grow too tall`);
    assert.ok(contactPopoverLayout.qrTop >= contactPopoverLayout.cards[0].top && contactPopoverLayout.qrBottom <= contactPopoverLayout.cards[0].bottom, `${viewport.name}: QR image should stay inside its card`);
    await page.mouse.move(20, 20);
    await page.waitForTimeout(600);
    await expectHidden(page, ".contact-popover", `${viewport.name}: contact popover should close after service trigger`);

    if (viewport.name === "desktop") {
      assert.equal(await page.locator(".search-button").count(), 0, "desktop: search button should be removed");
      assert.equal(await page.locator(".theme-button").count(), 0, "desktop: theme button should be removed");
      await page.locator('.main-nav a[href="#skill"]').click();
      await page.waitForTimeout(350);
      const skillPosition = await page.evaluate(() => ({
        hash: window.location.hash,
        top: Math.round(document.querySelector("#skill").getBoundingClientRect().top),
      }));
      assert.equal(skillPosition.hash, "#skill", "desktop: skill nav should update the hash");
      assert.ok(skillPosition.top >= 70, "desktop: skill section should not hide under the topbar");
      const topRowLayout = await page.evaluate(() => {
        const productsPanel = document.querySelector(".top-row > .products");
        const skillPanel = document.querySelector("#skill");
        const labPanel = document.querySelector("#lab");
        const panels = [productsPanel, skillPanel, labPanel].map((panel) => {
          const rect = panel.getBoundingClientRect();
          const titleRect = panel.querySelector(".section-head").getBoundingClientRect();
          const headIcon = panel.querySelector(".feature-head-icon")?.getBoundingClientRect();
          return {
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
            titleTop: titleRect.top,
            iconWidth: headIcon?.width ?? 0,
          };
        });
        const productCards = [...document.querySelectorAll("#products .product-card")].map((card) => {
          const rect = card.getBoundingClientRect();
          const iconRect = card.querySelector(".app-icon").getBoundingClientRect();
          const titleRect = card.querySelector("h3").getBoundingClientRect();
          const bodyRect = card.querySelector("p").getBoundingClientRect();
          const tagsRect = card.querySelector(".tags").getBoundingClientRect();
          return {
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
            iconTop: iconRect.top,
            titleTop: titleRect.top,
            bodyHeight: bodyRect.height,
            tagsBottom: rect.bottom - tagsRect.bottom,
          };
        });
        return {
          panelCount: panels.length,
          panelLefts: panels.map((panel) => panel.left),
          panelTops: panels.map((panel) => panel.top),
          panelBottoms: panels.map((panel) => panel.bottom),
          panelWidths: panels.map((panel) => panel.width),
          panelTitleTops: panels.map((panel) => panel.titleTop),
          panelIconWidths: panels.map((panel) => panel.iconWidth),
          productWidthDelta: Math.max(...productCards.map((card) => card.width)) - Math.min(...productCards.map((card) => card.width)),
          productHeightDelta: Math.max(...productCards.map((card) => card.height)) - Math.min(...productCards.map((card) => card.height)),
          productFirstRowDelta: Math.abs(productCards[0].top - productCards[1].top),
          productSecondRowDelta: Math.abs(productCards[2].top - productCards[3].top),
          productColumnGap: Math.abs(productCards[1].left - productCards[0].right),
          productWrapGap: productCards[2].top - productCards[0].bottom,
          productIconTopDelta: Math.max(...productCards.map((card) => card.iconTop - card.top)) - Math.min(...productCards.map((card) => card.iconTop - card.top)),
          productTitleTopDelta: Math.max(...productCards.map((card) => card.titleTop - card.top)) - Math.min(...productCards.map((card) => card.titleTop - card.top)),
          productBodyHeightDelta: Math.max(...productCards.map((card) => card.bodyHeight)) - Math.min(...productCards.map((card) => card.bodyHeight)),
          productTagsBottomDelta: Math.max(...productCards.map((card) => card.tagsBottom)) - Math.min(...productCards.map((card) => card.tagsBottom)),
        };
      });
      assert.equal(topRowLayout.panelCount, 3, "desktop: top row should render product, Skill and Lab panels");
      assert.ok(topRowLayout.panelLefts[0] < topRowLayout.panelLefts[1] && topRowLayout.panelLefts[1] < topRowLayout.panelLefts[2], "desktop: feature panels should appear in three columns");
      assert.ok(Math.max(...topRowLayout.panelTops) - Math.min(...topRowLayout.panelTops) <= 1, "desktop: feature panels should align at the top");
      assert.ok(Math.max(...topRowLayout.panelBottoms) - Math.min(...topRowLayout.panelBottoms) <= 1, "desktop: feature panels should align at the bottom");
      assert.ok(Math.max(...topRowLayout.panelTitleTops) - Math.min(...topRowLayout.panelTitleTops) <= 1, "desktop: feature titles should align");
      assert.ok(topRowLayout.panelWidths[0] > topRowLayout.panelWidths[1] && topRowLayout.panelWidths[0] > topRowLayout.panelWidths[2], "desktop: product panel should be wider than Skill and Lab");
      assert.ok(topRowLayout.panelWidths[1] > topRowLayout.panelWidths[2], "desktop: Skill panel should be wider than Vibe Coding Lab");
      assert.ok(topRowLayout.panelIconWidths.every((width) => width >= 26), "desktop: feature headings should include icons");
      assert.ok(topRowLayout.productWidthDelta <= 1, "desktop: product cards should be equal width");
      assert.ok(topRowLayout.productHeightDelta <= 1, "desktop: product cards should be equal height");
      assert.ok(topRowLayout.productFirstRowDelta <= 1, "desktop: first two product cards should share a row");
      assert.ok(topRowLayout.productSecondRowDelta <= 1, "desktop: second two product cards should share a row");
      assert.ok(topRowLayout.productColumnGap >= 8, "desktop: product card columns should not be cramped");
      assert.ok(topRowLayout.productWrapGap >= 8, "desktop: product card rows should keep spacing");
      assert.ok(topRowLayout.productIconTopDelta <= 1, "desktop: product icons should align");
      assert.ok(topRowLayout.productTitleTopDelta <= 1, "desktop: product titles should align");
      assert.ok(topRowLayout.productBodyHeightDelta <= 1, "desktop: product descriptions should reserve equal height");
      assert.ok(topRowLayout.productTagsBottomDelta <= 1, "desktop: product tags should align to the bottom");
      await page.locator(".contact-wrapper .contact-button").hover();
      await page.waitForTimeout(250);
      await expectVisible(page, ".contact-popover", "desktop: contact popover should open");
      await page.locator(".contact-popover").hover();
      await page.waitForTimeout(100);
      await expectVisible(page, ".contact-popover", "desktop: contact popover should stay open over popover");
      const contactLayout = await page.evaluate(() => {
        const cards = [...document.querySelectorAll(".contact-card")];
        const popover = document.querySelector(".contact-popover").getBoundingClientRect();
        const cardRect = cards[0].getBoundingClientRect();
        const visualRect = cards[0].querySelector(".contact-visual").getBoundingClientRect();
        return {
          cardCount: cards.length,
          popoverWidth: popover.width,
          cardWidth: cardRect.width,
          visualHeight: visualRect.height,
        };
      });
      assert.equal(contactLayout.cardCount, 1, "desktop: WeChat popover should only have one card");
      assert.ok(Math.abs(contactLayout.popoverWidth - 220) <= 1, "desktop: WeChat popover should be compact");
      assert.ok(contactLayout.cardWidth <= 196, "desktop: WeChat card should stay compact");
      assert.ok(contactLayout.visualHeight <= 181, "desktop: QR visual should stay controlled");
      assert.ok(await page.locator(".contact-visual img").evaluate((node) => node.naturalWidth > 0), "desktop: QR image should load");
      assert.equal(await page.locator(".xhs-contact-button").getAttribute("href"), "https://www.xiaohongshu.com/user/profile/643812aa000000001002a145");
      await page.mouse.move(20, 20);
      await page.waitForTimeout(600);
      await expectHidden(page, ".contact-popover", "desktop: contact popover should close after leaving");
    } else {
      for (const navItem of metrics.navItems) {
        await page.locator(".menu-toggle").click();
        assert.equal(await page.locator(".menu-toggle").getAttribute("aria-expanded"), "true", `${viewport.name}: mobile menu should open before ${navItem.text}`);
        await page.locator(`.main-nav a[href="${navItem.href}"]`).click();
        await page.waitForFunction((hash) => window.location.hash === hash, navItem.href);
        await page.waitForTimeout(600);
        assert.equal(await page.locator(".menu-toggle").getAttribute("aria-expanded"), "false", `${viewport.name}: mobile menu should close after ${navItem.text}`);
        const navTargetPosition = await page.evaluate((hash) => {
          const target = document.querySelector(hash);
          const header = document.querySelector(".topbar").getBoundingClientRect();
          const rect = target.getBoundingClientRect();
          return {
            targetTop: Math.round(rect.top),
            headerBottom: Math.round(header.bottom),
            viewportHeight: window.innerHeight,
            navOpen: document.querySelector(".main-nav").classList.contains("open"),
          };
        }, navItem.href);
        assert.equal(navTargetPosition.navOpen, false, `${viewport.name}: mobile nav should be closed after ${navItem.text}`);
        assert.ok(navTargetPosition.targetTop >= navTargetPosition.headerBottom - 1, `${viewport.name}: ${navItem.text} should not hide under the header`);
        assert.ok(navTargetPosition.targetTop <= navTargetPosition.viewportHeight * 0.5, `${viewport.name}: ${navItem.text} should land near the top of the viewport`);
      }
      if (viewport.width <= 600) {
        const mobileHeader = await page.evaluate(() => {
          const menu = document.querySelector(".menu-toggle").getBoundingClientRect();
          const contact = document.querySelector(".contact-wrapper .contact-button").getBoundingClientRect();
          const xhs = document.querySelector(".xhs-contact-button").getBoundingClientRect();
          const icon = document.querySelector(".contact-wrapper .contact-button img").getBoundingClientRect();
          return {
            menuLeft: menu.left,
            menuRight: menu.right,
            contactLeft: contact.left,
            xhsLeft: xhs.left,
            contactWidth: contact.width,
            contactHeight: contact.height,
            iconWidth: icon.width,
            iconHeight: icon.height,
            viewportWidth: window.innerWidth,
          };
        });
        assert.ok(mobileHeader.menuLeft > mobileHeader.viewportWidth / 2, "mobile: menu button should sit toward the right");
        assert.ok(mobileHeader.contactLeft > mobileHeader.menuRight, "mobile: contact button should remain to the right of menu");
        assert.ok(mobileHeader.xhsLeft > mobileHeader.contactLeft, "mobile: XHS button should sit to the right of WeChat");
        assert.ok(Math.abs(mobileHeader.contactWidth - mobileHeader.contactHeight) <= 1, "mobile: contact button should be circular");
        assert.ok(mobileHeader.contactWidth >= 41, "mobile: contact circle should be large enough");
        assert.ok(mobileHeader.iconWidth >= 41 && mobileHeader.iconHeight >= 41, "mobile: WeChat icon should fill the contact circle");
        await page.locator(".contact-wrapper .contact-button").click();
        await page.waitForTimeout(250);
        await expectVisible(page, ".contact-popover", "mobile: contact popover should open by click");
        await page.touchscreen.tap(10, 10);
        await page.waitForTimeout(250);
        await expectHidden(page, ".contact-popover", "mobile: contact popover should close by outside tap");
      }
    }

    console.log(viewport.name, metrics);
    await page.close();
  }

  await browser.close();
})();

async function expectVisible(page, selector, message) {
  const visible = await page.locator(selector).evaluate((node) => {
    const style = window.getComputedStyle(node);
    return style.visibility !== "hidden" && Number(style.opacity) > 0.9;
  });
  assert.equal(visible, true, message);
}

async function expectHidden(page, selector, message) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 1200) {
    const hidden = await page.locator(selector).evaluate((node) => {
      const style = window.getComputedStyle(node);
      return style.visibility === "hidden" || Number(style.opacity) < 0.1;
    });
    if (hidden) {
      return;
    }
    await page.waitForTimeout(50);
  }
  assert.fail(message);
}
