//
//  SDUIBlocks.swift
//  news_platform_ios
//
//  Created by Brady Foster on 11/5/26.
//
import Foundation
import SwiftUI

public extension Color {
    init(hex: String) {
        let cleaned = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: cleaned).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch cleaned.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 15, 23, 42)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// Story Deck Schema (deck_json)
public struct CardStyleConfig: Codable, Hashable {
    public let bg: String
    public let textColor: String
    public let accentColor: String
}

public struct CardStyleOverrides: Codable, Hashable {
    public let bg: String?
    public let textColor: String?
}

public struct CardTemplate: Codable, Hashable {
    public let id: String
    public let name: String
    public let cardType: String
    public let layoutVariant: String // "photo_hero" | "solid_color"
    public let styles: CardStyleConfig

    public static let heroPhotoOverlay = CardTemplate(
        id: "hero_photo_overlay",
        name: "Photo Hero (Glass Capsule)",
        cardType: "brief",
        layoutVariant: "photo_hero",
        styles: CardStyleConfig(bg: "#0F172A", textColor: "#FFFFFF", accentColor: "#EF4444")
    )

    public static let solidColor = CardTemplate(
        id: "solid_color",
        name: "Solid Color",
        cardType: "dispute",
        layoutVariant: "solid_color",
        styles: CardStyleConfig(bg: "#2563EB", textColor: "#FFFFFF", accentColor: "#93C5FD")
    )

    public static let registry: [String: CardTemplate] = [
        "hero_photo_overlay": .heroPhotoOverlay,
        "solid_color": .solidColor
    ]
}

public struct StoryCardSourceItem: Codable, Hashable {
    public let name: String
    public let url: String
    public let faviconUrl: String?
}

public struct StoryCard: Identifiable, Codable, Hashable {
    public let id: String
    public let order: Int?
    public let cardType: String
    public let headline: String
    public let body: String
    public let badge: String?
    public let footer: String?
    public let templateId: String?
    public let mediaUrl: String?
    public let mediaPos: String?
    public let entityMentioned: String?
    public let sources: [StoryCardSourceItem]?
    public let styleOverrides: CardStyleOverrides?

    enum CodingKeys: String, CodingKey {
        case id, order, type, cardType, headline, body, badge, footer, sources
        case templateId = "template_id"
        case mediaUrl = "media_url"
        case mediaPos = "media_pos"
        case entityMentioned
        case styleOverrides = "style_overrides"
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.order = try? container.decodeIfPresent(Int.self, forKey: .order)
        self.id = (try? container.decodeIfPresent(String.self, forKey: .id))
            ?? "card-\(self.order ?? Int.random(in: 1...9999))"
        self.cardType = (try? container.decodeIfPresent(String.self, forKey: .cardType))
            ?? (try? container.decodeIfPresent(String.self, forKey: .type))
            ?? "brief"
        self.headline = (try? container.decodeIfPresent(String.self, forKey: .headline)) ?? ""
        self.body = (try? container.decodeIfPresent(String.self, forKey: .body)) ?? ""
        self.badge = try? container.decodeIfPresent(String.self, forKey: .badge)
        self.footer = try? container.decodeIfPresent(String.self, forKey: .footer)
        self.templateId = try? container.decodeIfPresent(String.self, forKey: .templateId)
        self.mediaUrl = try? container.decodeIfPresent(String.self, forKey: .mediaUrl)
        self.mediaPos = try? container.decodeIfPresent(String.self, forKey: .mediaPos)
        self.entityMentioned = try? container.decodeIfPresent(String.self, forKey: .entityMentioned)
        self.styleOverrides = try? container.decodeIfPresent(CardStyleOverrides.self, forKey: .styleOverrides)
        let topSources = try? container.decodeIfPresent([StoryCardSourceItem].self, forKey: .sources)
        self.sources = topSources
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encodeIfPresent(order, forKey: .order)
        try container.encode(cardType, forKey: .cardType)
        try container.encode(headline, forKey: .headline)
        try container.encode(body, forKey: .body)
        try container.encodeIfPresent(badge, forKey: .badge)
        try container.encodeIfPresent(footer, forKey: .footer)
        try container.encodeIfPresent(templateId, forKey: .templateId)
        try container.encodeIfPresent(mediaUrl, forKey: .mediaUrl)
        try container.encodeIfPresent(mediaPos, forKey: .mediaPos)
        try container.encodeIfPresent(entityMentioned, forKey: .entityMentioned)
        try container.encodeIfPresent(sources, forKey: .sources)
        try container.encodeIfPresent(styleOverrides, forKey: .styleOverrides)
    }

    public var resolvedTemplate: CardTemplate {
        if let tid = templateId, let matched = CardTemplate.registry[tid] {
            return matched
        }
        return .heroPhotoOverlay
    }

    public var resolvedBackgroundColor: Color {
        let hex = styleOverrides?.bg ?? resolvedTemplate.styles.bg
        return Color(hex: hex)
    }

    public var resolvedTextColor: Color {
        let hex = styleOverrides?.textColor ?? resolvedTemplate.styles.textColor
        return Color(hex: hex)
    }
}

// Polymorphic Event SDUI Content Blocks (sdui_blocks)

public enum SDUIBlock: Identifiable, Decodable, Hashable {
    case heading(id: String, text: String)
    case paragraph(id: String, text: String)
    case image(id: String, url: String, caption: String?, credit: String?)
    case breakingBanner(id: String, title: String, severity: String, dismissible: Bool?)
    case dataChart(
        id: String,
        chartType: String,
        title: String,
        primaryLabel: String,
        primaryValue: Double,
        secondaryLabel: String,
        secondaryValue: Double,
        thresholdValue: Double?
    )
    case directQuote(id: String, speaker: String, role: String?, quote: String, avatarUrl: String?)
    case socialPostEmbed(
        id: String,
        platform: String,
        authorName: String,
        authorHandle: String,
        authorAvatarUrl: String?,
        contentText: String,
        sourceUrl: String,
        postedAt: String
    )
    case storyDeckPreview(id: String, deckId: String, title: String, cardCount: Int, leadBrief: String)
    case markdownText(id: String, body: String)
    case unhandled(id: String, type: String)

    public var id: String {
        switch self {
        case .heading(let id, _),
             .paragraph(let id, _),
             .image(let id, _, _, _),
             .breakingBanner(let id, _, _, _),
             .dataChart(let id, _, _, _, _, _, _, _),
             .directQuote(let id, _, _, _, _),
             .socialPostEmbed(let id, _, _, _, _, _, _, _),
             .storyDeckPreview(let id, _, _, _, _),
             .markdownText(let id, _),
             .unhandled(let id, _):
            return id
        }
    }

    private enum CodingKeys: String, CodingKey {
        case id, type, text, url, caption, credit, title, severity, dismissible
        case chartType, primaryLabel, primaryValue, secondaryLabel, secondaryValue, thresholdValue
        case speaker, role, quote, avatarUrl
        case platform, authorName, authorHandle, authorAvatarUrl, contentText, sourceUrl, postedAt
        case deckId, cardCount, leadBrief, body
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let id = (try? container.decode(String.self, forKey: .id)) ?? UUID().uuidString
        let type = (try? container.decode(String.self, forKey: .type)) ?? "unknown"

        switch type {
        case "heading":
            self = .heading(
                id: id,
                text: (try? container.decode(String.self, forKey: .text)) ?? ""
            )
        case "paragraph":
            self = .paragraph(
                id: id,
                text: (try? container.decode(String.self, forKey: .text)) ?? ""
            )
        case "image":
            self = .image(
                id: id,
                url: (try? container.decode(String.self, forKey: .url)) ?? "",
                caption: try? container.decodeIfPresent(String.self, forKey: .caption),
                credit: try? container.decodeIfPresent(String.self, forKey: .credit)
            )
        case "breaking_banner":
            self = .breakingBanner(
                id: id,
                title: (try? container.decode(String.self, forKey: .title)) ?? "",
                severity: (try? container.decode(String.self, forKey: .severity)) ?? "update",
                dismissible: try? container.decodeIfPresent(Bool.self, forKey: .dismissible)
            )
        case "data_chart":
            self = .dataChart(
                id: id,
                chartType: (try? container.decode(String.self, forKey: .chartType)) ?? "split_bar",
                title: (try? container.decode(String.self, forKey: .title)) ?? "",
                primaryLabel: (try? container.decode(String.self, forKey: .primaryLabel)) ?? "",
                primaryValue: (try? container.decode(Double.self, forKey: .primaryValue)) ?? 0,
                secondaryLabel: (try? container.decode(String.self, forKey: .secondaryLabel)) ?? "",
                secondaryValue: (try? container.decode(Double.self, forKey: .secondaryValue)) ?? 0,
                thresholdValue: try? container.decodeIfPresent(Double.self, forKey: .thresholdValue)
            )
        case "direct_quote_callout":
            self = .directQuote(
                id: id,
                speaker: (try? container.decode(String.self, forKey: .speaker)) ?? "",
                role: try? container.decodeIfPresent(String.self, forKey: .role),
                quote: (try? container.decode(String.self, forKey: .quote)) ?? "",
                avatarUrl: try? container.decodeIfPresent(String.self, forKey: .avatarUrl)
            )
        case "social_post_embed":
            self = .socialPostEmbed(
                id: id,
                platform: (try? container.decode(String.self, forKey: .platform)) ?? "x",
                authorName: (try? container.decode(String.self, forKey: .authorName)) ?? "",
                authorHandle: (try? container.decode(String.self, forKey: .authorHandle)) ?? "",
                authorAvatarUrl: try? container.decodeIfPresent(String.self, forKey: .authorAvatarUrl),
                contentText: (try? container.decode(String.self, forKey: .contentText)) ?? "",
                sourceUrl: (try? container.decode(String.self, forKey: .sourceUrl)) ?? "",
                postedAt: (try? container.decode(String.self, forKey: .postedAt)) ?? ""
            )
        case "story_deck_preview":
            self = .storyDeckPreview(
                id: id,
                deckId: (try? container.decode(String.self, forKey: .deckId)) ?? "",
                title: (try? container.decode(String.self, forKey: .title)) ?? "",
                cardCount: (try? container.decode(Int.self, forKey: .cardCount)) ?? 0,
                leadBrief: (try? container.decode(String.self, forKey: .leadBrief)) ?? ""
            )
        case "markdown_text":
            self = .markdownText(
                id: id,
                body: (try? container.decode(String.self, forKey: .body)) ?? ""
            )
        default:
            self = .unhandled(id: id, type: type)
        }
    }
}

// Polymorphic Entity Profile Blocks (profile_blocks)

public struct FactSheetPair: Identifiable, Codable, Hashable {
    public var id = UUID()
    public let label: String
    public let value: String

    private enum CodingKeys: String, CodingKey {
        case label, value
    }

    public init(id: UUID = UUID(), label: String, value: String) {
        self.id = id
        self.label = label
        self.value = value
    }
}

public struct SocialLinkItem: Codable, Hashable {
    public let platform: String
    public let url: String
}

public enum EntityProfileBlock: Identifiable, Decodable, Hashable {
    case textCard(id: String, title: String?, body: String)
    case bulletList(id: String, title: String, items: [String])
    case statStrip(id: String, text: String, subtext: String?)
    case factSheet(id: String, title: String?, pairs: [FactSheetPair])
    case socialLinks(id: String, title: String?, links: [SocialLinkItem])
    case imageCaption(id: String, imageUrl: String, caption: String?, altText: String?)
    case unhandled(id: String, type: String)

    public var id: String {
        switch self {
        case .textCard(let id, _, _),
             .bulletList(let id, _, _),
             .statStrip(let id, _, _),
             .factSheet(let id, _, _),
             .socialLinks(let id, _, _),
             .imageCaption(let id, _, _, _),
             .unhandled(let id, _):
            return id
        }
    }

    private enum CodingKeys: String, CodingKey {
        case id, type, title, body, items, text, subtext, pairs, links, imageUrl, caption, altText
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let id = (try? container.decode(String.self, forKey: .id)) ?? UUID().uuidString
        let type = (try? container.decode(String.self, forKey: .type)) ?? "unknown"

        switch type {
        case "text_card":
            self = .textCard(
                id: id,
                title: try? container.decodeIfPresent(String.self, forKey: .title),
                body: (try? container.decode(String.self, forKey: .body)) ?? ""
            )
        case "bullet_list":
            self = .bulletList(
                id: id,
                title: (try? container.decode(String.self, forKey: .title)) ?? "",
                items: (try? container.decode([String].self, forKey: .items)) ?? []
            )
        case "stat_strip":
            self = .statStrip(
                id: id,
                text: (try? container.decode(String.self, forKey: .text)) ?? "",
                subtext: try? container.decodeIfPresent(String.self, forKey: .subtext)
            )
        case "fact_sheet":
            self = .factSheet(
                id: id,
                title: try? container.decodeIfPresent(String.self, forKey: .title),
                pairs: (try? container.decode([FactSheetPair].self, forKey: .pairs)) ?? []
            )
        case "social_links":
            self = .socialLinks(
                id: id,
                title: try? container.decodeIfPresent(String.self, forKey: .title),
                links: (try? container.decode([SocialLinkItem].self, forKey: .links)) ?? []
            )
        case "image_caption":
            self = .imageCaption(
                id: id,
                imageUrl: (try? container.decode(String.self, forKey: .imageUrl)) ?? "",
                caption: try? container.decodeIfPresent(String.self, forKey: .caption),
                altText: try? container.decodeIfPresent(String.self, forKey: .altText)
            )
        default:
            self = .unhandled(id: id, type: type)
        }
    }
}
