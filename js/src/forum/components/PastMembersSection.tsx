import Component from 'flarum/common/Component';
import MemberCard from './MemberCard';

export interface PastMembersSectionAttrs {
  cohort: string | null;
  members: any[];
}

export default class PastMembersSection extends Component<PastMembersSectionAttrs> {
  view() {
    const { cohort, members } = this.attrs;

    if (!members || members.length === 0) {
      return null;
    }

    const title = cohort || 'Other'; // Fallback if cohort is null

    return (
      <div className="PastMembersSection">
        <h4 className="PastMembersSection-title">{title}</h4>
        <div className="MemberGrid MemberGrid--past">
          {members.map((member: any) => (
            <MemberCard member={member} muted={true} />
          ))}
        </div>
      </div>
    );
  }
}
