//
//  EventPageView.swift
//  news_platform_ios
//
//  Created by Brady Foster on 11/13/26.
//

import SwiftUI

public struct EventPageView: View {
    public let eventId: String
    public let initialTitle: String
    
    @State private var event: EventDetailPayload?
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var isShowingCards = false
    @State private var selectedCard = 0
    
    public enum ViewMode: String, CaseIterable {
        case cards = "Story Deck"
        case article = "Article & Sources"
    }
    
    public init(eventId: String, initialTitle: String = "") {
        self.eventId = eventId
        self.initialTitle = initialTitle
    }
    
    public var body: some View {
        Group {
            if isLoading {
                ProgressView("Loading story...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let errorMessage = errorMessage {
                ContentUnavailableView(
                    "Couldn't Load Story",
                    systemImage: "wifi.exclamationmark",
                    description: Text(errorMessage)
                )
            } else if let event = event {
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        headerSection(event)
                        if !event.entities.isEmpty {
                            entityPillStrip(event.entities)
                        }
                        storyDeckCarousel(event)
                        articleScrollView(event)
                        
                    }
                }
                .ignoresSafeArea(edges: [.horizontal, .top])
                .fullScreenCover(isPresented: $isShowingCards) {
                    StoryCardViewer(cards: event.deckJson, selectedCard: $selectedCard)
                }
            }
        }
        .task {
            await loadEvent()
        }
    }
    
    private func loadEvent() async {
        isLoading = true
        do {
            let loaded = try await NewsAPIClient.shared.fetchEventDetail(id: eventId)
            event = loaded
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
    
    private func headerSection(_ event: EventDetailPayload) -> some View {
        ZStack(alignment: .bottomLeading) {
            Group {
                if let coverUrl = event.coverImageUrl, let url = URL(string: coverUrl) {
                    AsyncImage(url: url) { phase in
                        switch phase {
                        case .success(let image):
                            image.resizable().scaledToFill()
                        default:
                            Color.secondary.opacity(0.2)
                        }
                    }
                } else {
                    Rectangle()
                        .fill(Color.secondary.opacity(0.3))
                        .overlay(
                            Image(systemName: "newspaper.fill")
                                .font(.title.bold())
                        )
                }
            }
            .containerRelativeFrame(.horizontal)
            .aspectRatio(4/5, contentMode: .fill)
            .clipped()
            .overlay{
                LinearGradient(stops: [
                    Gradient.Stop(color: .black, location: 0.0),
                    Gradient.Stop(color: .black.opacity(0.2), location: 0.5),
                    Gradient.Stop(color: .black.opacity(0.0), location: 1.0)
                ], startPoint: .bottom, endPoint: .top)
            }
            
            Text(event.title)
                .font(.title.bold())
                .fontDesign(.serif)
                .foregroundStyle(.white)
                .padding(20)
        }
    }
    
    private func entityPillStrip(_ entities: [EventDetailEntity]) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(entities) { entity in
                    NavigationLink(destination: EntityPageView(entityId: entity.id, initialName: entity.name)){
                        HStack(spacing: 6) {
                            Image(systemName: entity.categoryIconName)
                                .font(.caption)
                            Text(entity.name)
                                .font(.caption.weight(.semibold))
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.secondary.opacity(0.12), in: Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 8)
        }
    }
    
    private func storyDeckCarousel(_ event: EventDetailPayload) -> some View {
        Group {
            if event.deckJson.isEmpty {
                ContentUnavailableView(
                    "No Story Cards",
                    systemImage: "rectangle.stack",
                    description: Text("Switch to the Article tab to read the full synthesis.")
                )
            } else {
                VStack(alignment: .leading){
                    Text("Key Points")
                        .font(.title2.bold())
                        .padding(.horizontal, 10)
                    
                    ScrollView(.horizontal, showsIndicators: false){
                        HStack(spacing: 10) {
                            ForEach(event.deckJson.enumerated(), id: \.element) { index, card in
                                VStack{
                                    Text(card.headline)
                                        .font(.body.bold())
                                        .foregroundColor(card.resolvedTextColor)
                                        .multilineTextAlignment(.leading)
                                    Spacer()
                                }
                                .padding(10)
                                .frame(width: 150, height: 225)
                                .background(
                                    RoundedRectangle(cornerRadius: 12)
                                        .fill(card.resolvedBackgroundColor)
                                )
                                .onTapGesture {
                                    selectedCard = index
                                    isShowingCards.toggle()
                                }
                            }
                        }
                        .padding(.horizontal, 10)
                    }
                }
            }
        }
    }
    
    private func articleScrollView(_ event: EventDetailPayload) -> some View {
        VStack(alignment: .leading, spacing: 18) {
            if let lede = event.lede, !lede.isEmpty {
                VStack{
                    Text(lede)
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(.secondary)
                    Divider()
                }
            }
            
            
            ForEach(event.sduiBlocks) { block in
                SDUIBlockView(block: block)
            }
            
            if !event.sources.isEmpty {
                Divider().padding(.top, 8)
                Text("Verified Wire Grounding (\(event.sources.count) Sources)")
                    .font(.headline)
                
                ForEach(event.sources) { source in
                    if let url = URL(string: source.canonicalUrl) {
                        Link(destination: url) {
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(source.sourceName.uppercased())
                                        .font(.caption2.weight(.heavy))
                                        .foregroundStyle(.blue)
                                    Text(source.title)
                                        .font(.subheadline.weight(.medium))
                                        .foregroundStyle(.primary)
                                        .multilineTextAlignment(.leading)
                                }
                                Spacer()
                                Image(systemName: "arrow.up.right")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            .padding(12)
                            .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 10))
                        }
                    }
                }
            }
        }
        .padding(20)
    }
}

#Preview {
    EventPageView(eventId: "5079ad3a-7408-4535-91ef-18ab1936865f")
}
