//
//  SDUIBlocks.swift
//  news_platform_ios
//
//  Created by Brady Foster on 11/5/26.
//
import Foundation

enum SDUIBlock: Decodable, Identifiable {
    case breakingBanner(BannerData)
    case storyDeckPreview(DeckPreviewData)
    case dataChart(ChartData)
    case socialPost(SocialPostData)
    case directQuote(QuoteData)
    case markdown(MarkdownData)

    var id: String {
        switch self {
        case .breakingBanner(let d): return d.id
        case .storyDeckPreview(let d): return d.deckId
        case .dataChart(let d): return d.id
        case .socialPost(let d): return d.id
        case .directQuote(let d): return d.id
        case .markdown(let d): return d.id
        }
    }

    enum CodingKeys: String, CodingKey {
        case type, data
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)

        switch type {
        case "breaking_banner":
            self = .breakingBanner(try container.decode(BannerData.self, forKey: .data))
        case "story_deck_preview":
            self = .storyDeckPreview(try container.decode(DeckPreviewData.self, forKey: .data))
        case "data_chart":
            self = .dataChart(try container.decode(ChartData.self, forKey: .data))
        case "social_post_embed":
            self = .socialPost(try container.decode(SocialPostData.self, forKey: .data))
        case "direct_quote_callout":
            self = .directQuote(try container.decode(QuoteData.self, forKey: .data))
        default:
            self = .markdown(try container.decode(MarkdownData.self, forKey: .data))
        }
    }
}

// Supporting Codable Structs
struct BannerData: Codable { let id, title, severity: String; let dismissible: Bool }
struct DeckPreviewData: Codable { let deckId, title, leadBrief: String; let cardCount: Int }
struct ChartData: Codable { let id, chartType, title, primaryLabel, secondaryLabel: String; let primaryValue, secondaryValue: Double; let thresholdValue: Double? }
struct SocialPostData: Codable { let id, platform, authorName, authorHandle, authorAvatarUrl, contentText, sourceUrl, postedAt: String }
struct QuoteData: Codable { let id, speaker, role, quote: String; let avatarUrl: String? }
struct MarkdownData: Codable { let id, body: String }
