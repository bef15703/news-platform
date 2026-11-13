//
//  APIModels.swift
//  news_platform_ios
//
//  Created by Brady Foster on 11/13/26.
//

import Foundation
import SwiftUI

// /api/v1/feed

public struct FeedResponse: Decodable {
    public let status: String
    public let count: Int
    public let events: [FeedEventThumbnail]
}

public struct FeedEventThumbnail: Identifiable, Decodable, Hashable {
    public let id: String
    public let title: String
    public let lede: String?
    public let coverImageUrl: String?
    public let updatedAt: String
    public let cardCount: Int
    public let sourceCount: Int

    enum CodingKeys: String, CodingKey {
        case id, title, lede
        case coverImageUrl = "cover_image_url"
        case updatedAt = "updated_at"
        case cardCount = "card_count"
        case sourceCount = "source_count"
    }
}

// /api/v1/events/[id]

public struct EventDetailResponse: Decodable {
    public let status: String
    public let event: EventDetailPayload
}

public struct EventDetailEntity: Identifiable, Decodable, Hashable {
    public let id: String
    public let name: String
    public let slug: String
    public let titleRole: String?
    public let category: String
    public let avatarUrl: String?
    public let avatarPos: String?

    enum CodingKeys: String, CodingKey {
        case id, name, slug, category
        case titleRole = "title_role"
        case avatarUrl = "avatar_url"
        case avatarPos = "avatar_pos"
    }
    
    public var categoryIconName: String {
        return categoryIconNameHelper(category: self.category)
    }
}

public struct EventGroundingSource: Identifiable, Decodable, Hashable {
    public let id: String
    public let sourceName: String
    public let title: String
    public let canonicalUrl: String
    public let publishedAt: String

    enum CodingKeys: String, CodingKey {
        case id, title
        case sourceName = "source_name"
        case canonicalUrl = "canonical_url"
        case publishedAt = "published_at"
    }
}

public struct EventDetailPayload: Identifiable, Decodable {
    public let id: String
    public let title: String
    public let lede: String?
    public let coverImageUrl: String?
    public let status: String
    public let updatedAt: String
    public let deckJson: [StoryCard]
    public let sduiBlocks: [SDUIBlock]
    public let entities: [EventDetailEntity]
    public let sources: [EventGroundingSource]

    enum CodingKeys: String, CodingKey {
        case id, title, lede, status, entities, sources
        case coverImageUrl = "cover_image_url"
        case updatedAt = "updated_at"
        case deckJson = "deck_json"
        case sduiBlocks = "sdui_blocks"
    }
}

// /api/v1/entities/[id]

public struct EntityDossierResponse: Decodable {
    public let status: String
    public let entity: EntityDossierPayload
}

public struct EntityRecentEvent: Identifiable, Decodable, Hashable {
    public let id: String
    public let title: String
    public let lede: String?
    public let coverImageUrl: String?
    public let updatedAt: String

    enum CodingKeys: String, CodingKey {
        case id, title, lede
        case coverImageUrl = "cover_image_url"
        case updatedAt = "updated_at"
    }
}

public struct EntityMetadata: Codable, Hashable {
    public let role: String?
    public let badgeText: String?
    public let badgeBgColor: String?
    public let badgeFontColor: String?

    enum CodingKeys: String, CodingKey {
        case role
        case badgeText = "badge_text"
        case badgeBgColor = "badge_bg_color"
        case badgeFontColor = "badge_font_color"
    }

    public var hasBadge: Bool {
        guard let text = badgeText else { return false }
        return !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    public var resolvedBadgeBg: Color {
        Color(hex: badgeBgColor ?? "#0F172A")
    }

    public var resolvedBadgeFg: Color {
        Color(hex: badgeFontColor ?? "#FFFFFF")
    }
}


public struct EntityDossierPayload: Identifiable, Decodable {
    public let id: String
    public let name: String
    public let slug: String
    public let titleRole: String?
    public let category: String
    public let avatarUrl: String?
    public let avatarPos: String?
    public let contextBannerActive: Bool
    public let contextBannerSeverity: String?
    public let contextBannerTitle: String?
    public let contextBannerBody: String?
    public let profileBlocks: [EntityProfileBlock]
    public let metadata: EntityMetadata?
    public let recentEvents: [EntityRecentEvent]

    enum CodingKeys: String, CodingKey {
        case id, name, slug, category, metadata
        case titleRole = "title_role"
        case avatarUrl = "avatar_url"
        case avatarPos = "avatar_pos"
        case contextBannerActive = "context_banner_active"
        case contextBannerSeverity = "context_banner_severity"
        case contextBannerTitle = "context_banner_title"
        case contextBannerBody = "context_banner_body"
        case profileBlocks = "profile_blocks"
        case recentEvents = "recent_events"
    }
    
    public var categoryIconName: String {
        return categoryIconNameHelper(category: self.category)
    }
}
// /api/v1/search

public struct SearchResponse: Decodable {
    public let status: String
    public let query: String
    public let entities: [EventDetailEntity]
    public let events: [SearchEventResult]
}

public struct SearchEventResult: Identifiable, Decodable, Hashable {
    public let id: String
    public let title: String
    public let lede: String?
    public let coverImageUrl: String?
    public let updatedAt: String
    public let cardCount: Int

    enum CodingKeys: String, CodingKey {
        case id, title, lede
        case coverImageUrl = "cover_image_url"
        case updatedAt = "updated_at"
        case cardCount = "card_count"
    }
}

func categoryIconNameHelper(category: String) -> String {
    switch category {
        case "person": return "person.fill"
        case "govt_branch": return "building.classical.columns"
        case "govt_agency": return "building.fill"
        case "location": return "mappin"
        case "private_company": return "briefcase.fill"
        case "genre": return "bookmark.fill"
        case "topic": return "number.sign"
        default: return "number.sign"
    }
}
