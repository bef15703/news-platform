//
//  SDUIBlocks.swift
//  news_platform_ios
//
//  Created by Brady Foster on 11/5/26.
//
import Foundation
import SwiftUI

// Polymorphic block decoder matching packages/db contract
public enum SDUIBlock: Identifiable, Decodable {
    case heading(id: String, text: String)
    case paragraph(id: String, text: String)
    case image(id: String, url: String, caption: String?, credit: String?)
    case breakingBanner(id: String, title: String, severity: String)
    case dataChart(id: String, chartType: String, title: String, primaryLabel: String, primaryValue: Double, secondaryLabel: String, secondaryValue: Double)
    case directQuote(id: String, speaker: String, role: String?, quote: String, avatarUrl: String?)
    case unhandled(id: String)

    public var id: String {
        switch self {
        case .heading(let id, _): return id
        case .paragraph(let id, _): return id
        case .image(let id, _, _, _): return id
        case .breakingBanner(let id, _, _): return id
        case .dataChart(let id, _, _, _, _, _, _): return id
        case .directQuote(let id, _, _, _, _): return id
        case .unhandled(let id): return id
        }
    }

    private enum CodingKeys: String, CodingKey {
        case id, type, text, url, caption, credit, title, severity, chartType, primaryLabel, primaryValue, secondaryLabel, secondaryValue, speaker, role, quote, avatarUrl
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let id = try container.decode(String.self, forKey: .id)
        let type = try container.decode(String.self, forKey: .type)

        switch type {
        case "heading":
            self = .heading(id: id, text: try container.decode(String.self, forKey: .text))
        case "paragraph":
            self = .paragraph(id: id, text: try container.decode(String.self, forKey: .text))
        case "image":
            self = .image(
                id: id,
                url: try container.decode(String.self, forKey: .url),
                caption: try container.decodeIfPresent(String.self, forKey: .caption),
                credit: try container.decodeIfPresent(String.self, forKey: .credit)
            )
        case "breaking_banner":
            self = .breakingBanner(
                id: id,
                title: try container.decode(String.self, forKey: .title),
                severity: try container.decode(String.self, forKey: .severity)
            )
        case "data_chart":
            self = .dataChart(
                id: id,
                chartType: try container.decode(String.self, forKey: .chartType),
                title: try container.decode(String.self, forKey: .title),
                primaryLabel: try container.decode(String.self, forKey: .primaryLabel),
                primaryValue: try container.decode(Double.self, forKey: .primaryValue),
                secondaryLabel: try container.decode(String.self, forKey: .secondaryLabel),
                secondaryValue: try container.decode(Double.self, forKey: .secondaryValue)
            )
        case "direct_quote_callout":
            self = .directQuote(
                id: id,
                speaker: try container.decode(String.self, forKey: .speaker),
                role: try container.decodeIfPresent(String.self, forKey: .role),
                quote: try container.decode(String.self, forKey: .quote),
                avatarUrl: try container.decodeIfPresent(String.self, forKey: .avatarUrl)
            )
        default:
            self = .unhandled(id: id)
        }
    }
}