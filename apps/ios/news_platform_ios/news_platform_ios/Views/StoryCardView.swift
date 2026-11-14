//
//  StoryCardView.swift
//  news_platform_ios
//
//  Created by Brady Foster on 11/13/26.
//
import SwiftUI

public struct StoryCardView: View {
    public let card: StoryCard
    public let totalCards: Int

    private static let fallbackHeroURL = "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6d/US_Capitol_and_Grant_Memorial.JPG/960px-US_Capitol_and_Grant_Memorial.JPG"

    public init(card: StoryCard, totalCards: Int = 5) {
        self.card = card
        self.totalCards = max(totalCards, 1)
    }

    private var hasBadge: Bool {
        guard let b = card.badge else { return false }
        return !b.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private var hasMedia: Bool {
        guard let m = card.mediaUrl else { return false }
        return !m.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private var hasFooter: Bool {
        guard let f = card.footer else { return false }
        return !f.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    public var body: some View {
            if card.resolvedTemplate.layoutVariant == "photo_hero" {
                photoHeroLayout
            } else {
                solidColorLayout
            }
    }

    // Photo Hero Variant (Frosted Glass Lower Capsule)

    private var photoHeroLayout: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 8) {
                ForEach(0..<totalCards, id: \.self) { index in
                    Capsule()
                        .fill(index <= (card.order  ?? 0) - 1 ? Color.white : Color.white.opacity(0.35))
                        .frame(height: 3)
                }
            }
            .padding(.top, 32)
            // Header Badge & Order
            HStack {
                if hasBadge {
                    Text(card.badge!.uppercased())
                        .font(.system(size: 16, weight: .bold))
                        .tracking(0.8)
                        .foregroundStyle(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(.ultraThinMaterial, in: Capsule())
                        .overlay(
                            Capsule().stroke(Color.white.opacity(0.25), lineWidth: 1)
                        )
                } else {
                    Spacer().frame(height: 24)
                }
                
                Spacer()
                
                Text("\(card.order ?? 1) / \(totalCards)")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(.white.opacity(0.75))
            }
            
            Spacer()
            
            // Frosted Glass Lower Pill
            VStack(alignment: .leading, spacing: 8) {
                Text(card.headline.isEmpty ? "Headline" : card.headline)
                    .font(.title2.bold())
                    .foregroundStyle(.white)
                    .fixedSize(horizontal: false, vertical: true)
                
                Text(card.body.isEmpty ? "Card body text..." : card.body)
                    .font(.body)
                    .lineSpacing(3)
                    .foregroundStyle(.white.opacity(0.92))
                    .lineLimit(8)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(18)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .stroke(Color.white.opacity(0.22), lineWidth: 1)
            )
        }
        .padding(24)
        .safeAreaPadding()
        .background {
            GeometryReader { geo in
                ZStack {
                    let urlString = hasMedia ? card.mediaUrl! : Self.fallbackHeroURL
                    AsyncImage(url: URL(string: urlString)) { phase in
                        switch phase {
                        case .success(let image):
                            image
                                .resizable()
                                .scaledToFill()
                                .frame(width: geo.size.width, height: geo.size.height)
                                .clipped()
                        default:
                            Color(hex: "#0F172A")
                        }
                    }
                    
                    LinearGradient(
                        colors: [
                            Color.black.opacity(0.85),
                            Color.black.opacity(0.25),
                            Color.clear
                        ],
                        startPoint: .bottom,
                        endPoint: .top
                    )
                }
            }
            .ignoresSafeArea()
        }
    }

    // Solid Color Split Variant

    private var solidColorLayout: some View {
        let fg = card.resolvedTextColor

        return VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 8) {
                ForEach(0..<totalCards, id: \.self) { index in
                    Capsule()
                        .fill(index <= (card.order  ?? 0) - 1 ? Color.white : Color.white.opacity(0.35))
                        .frame(height: 3)
                }
            }
            .padding(.top, 32)
            // Header Row
            HStack {
                if hasBadge {
                    Text(card.badge!.uppercased())
                        .font(.system(size: 16, weight: .bold))
                        .tracking(0.8)
                        .foregroundStyle(fg)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(fg.opacity(0.15), in: Capsule())
                        .overlay(
                            Capsule().stroke(fg.opacity(0.22), lineWidth: 1)
                        )
                } else {
                    Spacer().frame(height: 31)
                }

                Spacer()

                Text("\(card.order ?? 1) / \(totalCards)")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(fg.opacity(0.65))
            }

            // Headline & Body
            VStack(alignment: .leading, spacing: 12) {
                Text(card.headline.isEmpty ? "Core Tension" : card.headline)
                    .font(.title2.bold())
                    .foregroundStyle(fg)
                    .fixedSize(horizontal: false, vertical: true)

                Text(card.body)
                    .font(.body)
                    .lineSpacing(3)
                    .foregroundStyle(fg.opacity(0.9))
            }

            // Corroboration Sources Links
            if let sources = card.sources, !sources.isEmpty {
                ScrollView() {
                    ForEach(Array(sources.prefix(10).enumerated()), id: \.offset) { _, source in
                        if let url = URL(string: source.url) {
                            Link(destination: url) {
                                HStack(spacing: 8) {
                                    Image(systemName: "link")
                                        .font(.system(size: 16, weight: .semibold))
                                        .foregroundStyle(fg.opacity(0.75))
                                    Text(source.name)
                                        .font(.system(size: 16, weight: .semibold))
                                        .foregroundStyle(fg)
                                        .lineLimit(1)
                                    Spacer()
                                }
                                .padding(10)
                                .background(fg.opacity(0.1), in: RoundedRectangle(cornerRadius: 10))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 10)
                                        .stroke(fg.opacity(0.18), lineWidth: 1)
                                )
                            }
                        }
                    }
                }
            }
            Spacer(minLength: 0)
            // Inline Media Slot
            if hasMedia, let url = URL(string: card.mediaUrl!) {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFit()
                            .clipped()
                    default:
                        Color.black.opacity(0.25)
                    }
                }                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                
            }

            Spacer(minLength: 0)

            // Dynamic Footer
            if hasFooter {
                VStack(alignment: .leading, spacing: 8) {
                    Divider().overlay(fg.opacity(0.9))
                    Text(card.footer!)
                        .font(.body.italic())
                        .foregroundStyle(fg.opacity(0.75))
                }
            }
        }
        .padding(24)
        .safeAreaPadding()
        .background(card.resolvedBackgroundColor)
    }
}

public struct StoryCardViewer: View {
    public let cards: [StoryCard]
    @Binding var selectedCard: Int
    @State private var dragOffset: CGFloat = 0
    @Environment(\.dismiss) private var dismiss
    
    public var body: some View {
        ZStack(alignment: .top) {
            StoryCardView(card: cards[selectedCard])
            //Tap Controls
            GeometryReader { geo in
                HStack(spacing: 0) {
                    // Left 30%: Previous Slide
                    Color.clear
                        .frame(width: geo.size.width * 0.3)
                        .contentShape(Rectangle())
                        .onTapGesture {
                            if selectedCard > 0 { selectedCard -= 1 }
                        }

                    // Right 70%: Next Slide (or dismiss at the end)
                    Color.clear
                        .frame(width: geo.size.width * 0.7)
                        .contentShape(Rectangle())
                        .onTapGesture {
                            if selectedCard < cards.count - 1 {
                                selectedCard += 1
                            } else {
                                dismiss()
                            }
                        }
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .clipShape(
            RoundedRectangle(
                cornerRadius: dragOffset > 0 ? 48 : 0,
                style: .continuous // Matches Apple's hardware squircle bezel
            )
        )
        .offset(y: dragOffset)
        .scaleEffect(1.0 - (dragOffset / 1500)) // Shrink on swipe down
        .ignoresSafeArea()
        .presentationBackground(.clear)
        .gesture(
            DragGesture()
                .onChanged { value in
                    // Only track downward drags
                    if value.translation.height > 0 {
                        dragOffset = value.translation.height
                    }
                }
                .onEnded { value in
                    if value.translation.height > 140 {
                        dismiss()
                    } else {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                            dragOffset = 0
                        }
                    }
                }
        )
    }
}

#Preview {
    EventPageView(eventId: "5079ad3a-7408-4535-91ef-18ab1936865f")
}
