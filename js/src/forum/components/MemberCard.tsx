import Component from 'flarum/common/Component';
import app from 'flarum/forum/app';
import Link from 'flarum/common/components/Link';
import avatar from 'flarum/common/helpers/avatar';

export interface MemberCardAttrs {
  member: any;
  muted?: boolean;
}

export default class MemberCard extends Component<MemberCardAttrs> {
  view() {
    const { member, muted = false } = this.attrs;
    const user = member.user;
    
    // Use custom name if provided, otherwise fallback to Flarum display name
    const displayName = member.name || user?.displayName || 'Unknown';
    
    // Avatar
    const avatarEl = user ? (
      <Link href={app.route.user(user)}>
        {avatar(user, { className: 'MemberCard-avatar' })}
      </Link>
    ) : (
      <span className="Avatar MemberCard-avatar" />
    );

    const nameEl = user ? (
      <Link href={app.route.user(user)} className="MemberCard-name">
        {displayName}
      </Link>
    ) : (
      <span className="MemberCard-name">{displayName}</span>
    );

    const positionEl = member.position ? (
      <span 
        className="MemberCard-positionBadge" 
        style={member.position.color ? { backgroundColor: member.position.color } : {}}
      >
        {member.position.name}
      </span>
    ) : null;

    const cohortEl = member.cohort ? (
      <span className="MemberCard-cohortBadge">{member.cohort}</span>
    ) : null;

    const tenureEl = <div className="MemberCard-tenure">{this.formatTenure(member)}</div>;

    return (
      <div className={`MemberCard ${muted ? 'MemberCard--muted' : ''}`}>
        <div className="MemberCard-header">
          {avatarEl}
        </div>
        <div className="MemberCard-body">
          {nameEl}
          <div className="MemberCard-badges">
            {positionEl}
            {cohortEl}
          </div>
          {tenureEl}
        </div>
      </div>
    );
  }

  formatTenure(member: any): string {
    const granularity = app.forum.attribute('member-directory.date_granularity') || 'year';
    
    const formatStr = (dateStr: string | null): string => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      
      const bYear = d.getFullYear() + 543;
      
      if (granularity === 'year') {
        return `${bYear}`;
      } else if (granularity === 'month') {
        const month = d.toLocaleString('th-TH', { month: 'short' });
        return `${month} ${bYear}`;
      } else {
        const day = d.getDate();
        const month = d.toLocaleString('th-TH', { month: 'short' });
        return `${day} ${month} ${bYear}`;
      }
    };

    const start = formatStr(member.startedAt);
    const end = formatStr(member.endedAt);

    if (start && end) {
      return `${start} – ${end}`;
    } else if (start && !end) {
      const startedText = app.translator.trans('tapao-org-member-directory.forum.page.tenure_started');
      // If it's a current member, use 'Present'
      if (!this.attrs.muted) {
         const presentText = app.translator.trans('tapao-org-member-directory.forum.page.tenure_present');
         return `${start} – ${presentText}`;
      }
      return `${startedText} ${start}`;
    } else if (!start && end) {
      return `– ${end}`;
    }
    
    return '';
  }
}
