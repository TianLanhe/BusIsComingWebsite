package sqlite

// Traffic and download analysis deliberately reuse LoadOverviewEvents. The storage
// adapter performs one bounded, indexed detail read; session, funnel and natural-time
// bucket rules remain in the domain/application layers and no aggregate table is kept.
