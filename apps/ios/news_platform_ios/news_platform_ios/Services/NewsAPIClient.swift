//
//  NewsAPIClient.swift
//  news_platform_ios
//
//  Created by Brady Foster on 11/13/26.
//

import Foundation

public enum APIError: LocalizedError {
    case invalidURL
    case badStatusCode(Int)
    case decodingError(Error)

    public var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid API endpoint URL."
        case .badStatusCode(let code):
            return "Server returned HTTP \(code)."
        case .decodingError(let error):
            return "Failed to decode payload: \(error.localizedDescription)"
        }
    }
}

public final class NewsAPIClient {
    public static let shared = NewsAPIClient()

    private let baseURL: String
    private let session: URLSession
    private let decoder: JSONDecoder

    public init(baseURL: String = "http://localhost:3000/api/v1") {
        self.baseURL = baseURL
        self.session = URLSession.shared
        self.decoder = JSONDecoder()
    }

    public func fetchFeed(limit: Int = 20, offset: Int = 0) async throws -> [FeedEventThumbnail] {
        guard let url = URL(string: "\(baseURL)/feed?limit=\(limit)&offset=\(offset)") else {
            throw APIError.invalidURL
        }
        let response: FeedResponse = try await request(url: url)
        return response.events
    }

    public func fetchEventDetail(id: String) async throws -> EventDetailPayload {
        guard let url = URL(string: "\(baseURL)/events/\(id)") else {
            throw APIError.invalidURL
        }
        let response: EventDetailResponse = try await request(url: url)
        return response.event
    }

    public func fetchEntityDossier(id: String) async throws -> EntityDossierPayload {
        guard let url = URL(string: "\(baseURL)/entities/\(id)") else {
            throw APIError.invalidURL
        }
        let response: EntityDossierResponse = try await request(url: url)
        return response.entity
    }

    public func search(query: String) async throws -> SearchResponse {
        guard var components = URLComponents(string: "\(baseURL)/search") else {
            throw APIError.invalidURL
        }
        components.queryItems = [URLQueryItem(name: "q", value: query)]
        guard let url = components.url else {
            throw APIError.invalidURL
        }
        return try await request(url: url)
    }

    private func request<T: Decodable>(url: URL) async throws -> T {
        let (data, response) = try await session.data(from: url)
        if let httpResponse = response as? HTTPURLResponse,
           !(200...299).contains(httpResponse.statusCode) {
            throw APIError.badStatusCode(httpResponse.statusCode)
        }
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            print("[NewsAPIClient] Decoding error on \(url.absoluteString): \(error)")
            throw APIError.decodingError(error)
        }
    }
}
