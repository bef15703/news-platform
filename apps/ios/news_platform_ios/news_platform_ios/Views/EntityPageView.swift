//
//  EntityPageView.swift
//  news_platform_ios
//
//  Created by Brady Foster on 11/13/26.
//

import SwiftUI

public struct EntityPageView: View {
    public let entityId: String
    public let initialName: String

    @State private var dossier: EntityDossierPayload?
    @State private var isLoading = true
    @State private var errorMessage: String?
    @Environment(\.dismiss) private var dismiss

    public init(entityId: String, initialName: String = "Entity Page") {
        self.entityId = entityId
        self.initialName = initialName
    }

    public var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView("Loading page...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if let errorMessage = errorMessage {
                    ContentUnavailableView(
                        "Unable to Load Entity",
                        systemImage: "exclamationmark.triangle",
                        description: Text(errorMessage)
                    )
                } else if let dossier = dossier {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 20) {
                            headerSection(dossier)

                            VStack(alignment: .leading, spacing: 18) {
                                if dossier.contextBannerActive {
                                    contextWarningBanner(dossier)
                                }
                                ForEach(dossier.profileBlocks) { block in
                                    renderProfileBlock(block)
                                }
                                
                                if !dossier.recentEvents.isEmpty {
                                    recentCoverageSection(dossier.recentEvents)
                                }
                            }
                            .padding(.horizontal, 20)
                        }
                    }
                    .ignoresSafeArea(edges: [.horizontal, .top])
                }
            }
            .task {
                await loadDossier()
            }
        }
    }

    private func loadDossier() async {
        isLoading = true
        do {
            dossier = try await NewsAPIClient.shared.fetchEntityDossier(id: entityId)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    private func headerSection(_ entity: EntityDossierPayload) -> some View {
        ZStack(alignment: .bottomLeading) {
            Group {
                if let avatarUrl = entity.avatarUrl, let url = URL(string: avatarUrl) {
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
                            Image(systemName: entity.categoryIconName)
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

            HStack{
                VStack(alignment: .leading, spacing: 4) {
                    Text(entity.name)
                        .font(.title2.bold())
                    if let role = entity.titleRole, !role.isEmpty {
                        Text(role)
                            .font(.subheadline)
                    }
                }
                .foregroundStyle(.white)
                Spacer()
                if let metadata = entity.metadata, let badgeText = metadata.badgeText, metadata.hasBadge {
                    Text(badgeText)
                        .font(.body.bold())
                        .foregroundStyle(metadata.resolvedBadgeFg)
                        .padding(.horizontal, 15)
                        .padding(.vertical, 5)
                        .background(Capsule().fill(metadata.resolvedBadgeBg))
                }
            }
            .padding(20)
        }
    }

    private func contextWarningBanner(_ entity: EntityDossierPayload) -> some View {
        let isCritical = entity.contextBannerSeverity == "critical"
        let color: Color = isCritical ? .red : (entity.contextBannerSeverity == "warning" ? .orange : .blue)

        return VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 6) {
                Image(systemName: "exclamationmark.shield.fill")
                    .foregroundStyle(color)
                Text(entity.contextBannerTitle ?? "Editorial Context Note")
                    .font(.subheadline.bold())
                    .foregroundStyle(color)
            }
            if let body = entity.contextBannerBody, !body.isEmpty {
                Text(body)
                    .font(.footnote)
                    .foregroundStyle(.primary.opacity(0.85))
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(color.opacity(0.12), in: RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(color.opacity(0.35), lineWidth: 1)
        )
    }

    @ViewBuilder
    private func renderProfileBlock(_ block: EntityProfileBlock) -> some View {
        switch block {
        case .textCard(_, let title, let body):
            VStack(alignment: .leading, spacing: 8) {
                if let title = title, !title.isEmpty {
                    Text(title).font(.title3.bold())
                }
                Text(body)
                    .font(.body)
                    .lineSpacing(3)
                    .foregroundStyle(.secondary)
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 14))

        case .bulletList(_, let title, let items):
            VStack(alignment: .leading, spacing: 8) {
                if !title.isEmpty {
                    Text(title).font(.title3.bold())
                }
                ForEach(items, id: \.self) { item in
                    HStack(alignment: .top, spacing: 8) {
                        Text("•").bold()
                        Text(item).font(.body)
                    }
                }
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 14))

        case .statStrip(_, let text, let subtext):
            VStack(alignment: .center, spacing: 4) {
                Text(text)
                    .font(.title3.bold())
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity, alignment: .center)
                if let subtext = subtext, !subtext.isEmpty {
                    Text(subtext)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.blue.opacity(0.1), in: RoundedRectangle(cornerRadius: 14))

        case .factSheet(_, let title, let pairs):
            VStack(alignment: .leading, spacing: 10) {
                if let title = title, !title.isEmpty {
                    Text(title).font(.title3.bold())
                }
                Grid(alignment: .leading, horizontalSpacing: 16, verticalSpacing: 10) {
                    ForEach(pairs) { pair in
                        GridRow(alignment: .firstTextBaseline) {
                            Text(pair.label)
                                .font(.body.bold())
                                .foregroundStyle(.secondary)
                            Text(pair.value)
                                .font(.body.weight(.medium))
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .multilineTextAlignment(.leading)
                        }
                    }
                }
            }
            .padding(16)
            .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 14))

        case .socialLinks(_, let title, let links):
            VStack(alignment: .leading, spacing: 8) {
                if let title = title, !title.isEmpty {
                    Text(title).font(.title3.bold())
                }
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 20) {
                        ForEach(links, id: \.url) { link in
                            if let url = URL(string: link.url) {
                                Link(destination: url) {
                                    socialIcon(platform: link.platform)
                                        .renderingMode(.template)
                                        .resizable()
                                        .scaledToFit()
                                        .frame(width: 32, height: 32)
                                        .foregroundStyle(.primary)
                                        .frame(width: 52, height: 52)
                                        .background(Circle().fill(.secondary.opacity(0.12)))
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }
            }
            .padding(.vertical, 8)

        case .imageCaption(_, let imageUrl, let caption, _):
            VStack(alignment: .leading, spacing: 0) {
                if let url = URL(string: imageUrl) {
                    AsyncImage(url: url) { phase in
                        if case .success(let image) = phase {
                            image.resizable().scaledToFill()
                                .containerRelativeFrame(.horizontal)
                                .frame(maxWidth: .infinity, maxHeight: 600)
                                .clipped()
                        }
                    }
                }
                if let caption = caption, !caption.isEmpty {
                    Text(caption)
                        .font(.subheadline.italic())
                        .padding(.horizontal, 20)
                        .padding(.vertical, 10)
                }
            }
            .background(.secondary.opacity(0.12))
            .clipShape(RoundedRectangle(cornerRadius: 12))

        case .unhandled:
            EmptyView()
        }
    }

    private func recentCoverageSection(_ events: [EntityRecentEvent]) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Related Coverage")
                .font(.headline)
            ForEach(events) { event in
                VStack(alignment: .leading, spacing: 4) {
                    Text(event.title)
                        .font(.subheadline.bold())
                    if let lede = event.lede, !lede.isEmpty {
                        Text(lede)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .lineLimit(2)
                    }
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 10))
            }
        }
    }
    
    func socialIcon(platform: String) -> Image {
        switch platform{
        case "x", "instagram", "snapchat", "youtube", "bluesky", "tiktok", "threads", "facebook":
            return Image("\(platform)_icon")
        default:
            return Image(systemName: "link")
        }
    }
}

#Preview {
    EntityPageView(entityId: "53a494bb-a871-4260-b58a-36a3797c5cfa")
}
