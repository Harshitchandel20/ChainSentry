#!/usr/bin/env python3
"""
ChainSentry Graph Database Seeding Script.
Connects to FalkorDB and idempotently creates the security knowledge graph nodes,
transitive dependency chains, service perimeters, business assets, and owner mappings.
"""
import sys
from app.services.falkordb_service import graph_service

def main():
    print("Connecting to FalkorDB and seeding graph...")
    try:
        graph_service.seed_graph()
        print(f"Graph '{graph_service.graph.name if graph_service.graph else 'chainsentry'}' seeded successfully.")
        print(f"FalkorDB connection status: {'Connected' if graph_service.is_connected else 'Synchronized Fallback Mode'}")
    except Exception as e:
        print(f"Error during graph seed: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
