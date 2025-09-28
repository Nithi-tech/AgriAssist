import { NextResponse } from 'next/server';
import { getAllPolicies, getPoliciesByState, searchPolicies, getAllStates, getPolicyStatistics } from '../../../../lib/policies';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');
    const search = searchParams.get('search');
    const action = searchParams.get('action');

    // Handle different actions
    switch (action) {
      case 'states':
        const states = await getAllStates();
        return NextResponse.json({
          success: true,
          data: states
        });

      case 'statistics':
        const stats = await getPolicyStatistics();
        return NextResponse.json({
          success: true,
          data: stats
        });

      default:
        // Handle policy queries
        let policies;

        if (search) {
          policies = await searchPolicies(search);
        } else if (state) {
          policies = await getPoliciesByState(state);
        } else {
          policies = await getAllPolicies();
        }

        return NextResponse.json({
          success: true,
          data: policies,
          count: policies.length,
          query: { state, search }
        });
    }
  } catch (error) {
    console.error('Policies API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch policies',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
